const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const Chat = require('../models/Chat');
const parseQueue = require('../workers/parseWorker');
const { downloadFromDrive } = require('../utils/driveDownloader');

// Upload from Google Drive link
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { driveUrl, chatName } = req.body;
        const userId = req.userId;

        if (!driveUrl) {
            return res.status(400).json({ error: 'Google Drive link is required' });
        }

        // Validate Drive URL format
        if (!driveUrl.includes('drive.google.com')) {
            return res.status(400).json({ error: 'Invalid Google Drive link' });
        }

        const uploadUuid = uuidv4();
        const userUploadDir = path.join(
            process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
            userId.toString(),
            uploadUuid
        );
        const destPath = path.join(userUploadDir, 'raw.zip');

        console.log(`[Drive Upload] Starting download for user ${userId}`);
        console.log(`[Drive Upload] URL: ${driveUrl}`);

        // Create chat record first
        const chat = await Chat.create(
            userId,
            chatName || 'WhatsApp Chat',
            'drive-upload.zip',
            uploadUuid
        );

        // Start download in background (don't await)
        downloadAndProcess(driveUrl, destPath, userId, chat.id, uploadUuid)
            .catch(error => {
                console.error('[Drive Upload] Background download failed:', error);
            });

        // Return immediately with job ID
        res.status(202).json({
            message: 'Download started',
            jobId: chat.id,
            chatId: chat.id
        });

    } catch (error) {
        console.error('[Drive Upload] Error:', error);
        res.status(500).json({
            error: 'Failed to start download',
            details: error.message
        });
    }
});

/**
 * Download from Drive and process in background
 */
async function downloadAndProcess(driveUrl, destPath, userId, chatId, uploadUuid) {
    try {
        console.log(`[Drive Upload] Downloading to: ${destPath}`);

        // Download file with progress tracking
        const result = await downloadFromDrive(driveUrl, destPath, (downloaded, total) => {
            const percent = Math.round((downloaded / total) * 100);
            if (percent % 10 === 0) { // Log every 10%
                console.log(`[Drive Upload] Progress: ${percent}%`);
            }
        });

        console.log(`[Drive Upload] Download complete: ${result.size} bytes`);

        // Queue parse job
        const job = await parseQueue.add({
            userId,
            chatId,
            zipPath: destPath,
            uploadUuid
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        });

        console.log(`[Drive Upload] Parse job queued: ${job.id}`);

    } catch (error) {
        console.error(`[Drive Upload] Failed for chat ${chatId}:`, error);

        // Update chat status to failed
        try {
            await Chat.updateStatus(chatId, 'failed', error.message);
        } catch (updateError) {
            console.error('[Drive Upload] Failed to update chat status:', updateError);
        }
    }
}

module.exports = router;
