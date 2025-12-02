const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const DriveDownloader = require('../utils/driveDownloader');
const Chat = require('../models/Chat');
const parseQueue = require('../workers/parseWorker');
const authMiddleware = require('../middleware/auth');

// Store active downloads in memory (for progress tracking)
// In production, this should be in Redis
const activeDownloads = new Map();

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.userId;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const fileId = DriveDownloader.getFileId(url);
        if (!fileId) {
            return res.status(400).json({ error: 'Invalid Google Drive URL' });
        }

        const uploadUuid = uuidv4();
        const userUploadDir = path.join(
            process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
            userId.toString(),
            uploadUuid
        );

        await fs.mkdir(userUploadDir, { recursive: true });
        const destPath = path.join(userUploadDir, 'raw.zip');

        // Start download in background
        activeDownloads.set(uploadUuid, {
            status: 'downloading',
            progress: 0,
            startTime: Date.now()
        });

        // Async download process
        DriveDownloader.download(url, destPath, (downloaded, total) => {
            const progress = Math.round((downloaded / total) * 100);
            const state = activeDownloads.get(uploadUuid);
            if (state) {
                state.progress = progress;
                activeDownloads.set(uploadUuid, state);
            }
        }).then(async () => {
            console.log(`[Drive] Download completed: ${uploadUuid}`);

            // Create chat record
            const chatName = `Drive Import ${new Date().toISOString().split('T')[0]}`;
            const chat = await Chat.create(userId, chatName, 'drive_import.zip', uploadUuid);

            // Queue parse job
            await parseQueue.add({
                userId,
                chatId: chat.id,
                zipPath: destPath,
                uploadUuid
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000
                }
            });

            activeDownloads.set(uploadUuid, {
                status: 'completed',
                progress: 100,
                chatId: chat.id
            });

        }).catch(error => {
            console.error(`[Drive] Download failed: ${error.message}`);
            activeDownloads.set(uploadUuid, {
                status: 'error',
                error: error.message
            });
        });

        res.json({
            message: 'Download started',
            uploadUuid,
            fileId
        });

    } catch (error) {
        console.error('Drive upload error:', error);
        res.status(500).json({ error: 'Failed to start download' });
    }
});

// Check download status
router.get('/status/:uploadUuid', authMiddleware, (req, res) => {
    const { uploadUuid } = req.params;
    const status = activeDownloads.get(uploadUuid);

    if (!status) {
        return res.status(404).json({ error: 'Download not found' });
    }

    res.json(status);
});

module.exports = router;
