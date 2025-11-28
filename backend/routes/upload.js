const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const Chat = require('../models/Chat');
const parseQueue = require('../workers/parseWorker');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadUuid = uuidv4();
        req.uploadUuid = uploadUuid;

        const uploadDir = path.join(
            process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
            req.userId.toString(),
            uploadUuid
        );

        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'raw.zip');
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 524288000 // 500MB default
    },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Only .zip files are allowed'));
        }
        cb(null, true);
    }
});

/**
 * POST /api/upload
 * Upload WhatsApp ZIP export
 */
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const uploadUuid = req.uploadUuid || uuidv4();
        const zipPath = req.file.path;

        // Create chat record
        const chat = await Chat.create(
            req.userId,
            req.file.originalname.replace('.zip', ''),
            req.file.originalname,
            uploadUuid
        );

        // Queue parse job
        const job = await parseQueue.add({
            userId: req.userId,
            chatId: chat.id,
            zipPath,
            uploadUuid
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        });

        res.status(202).json({
            message: 'Upload successful, processing started',
            chatId: chat.id,
            jobId: job.id,
            status: 'processing'
        });

    } catch (error) {
        console.error('Upload error details:', error);
        console.error('Stack:', error.stack);

        if (error.message === 'Only .zip files are allowed') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

/**
 * GET /api/upload/status/:jobId
 * Get parse job status
 */
router.get('/status/:jobId', authMiddleware, async (req, res) => {
    try {
        const job = await parseQueue.getJob(req.params.jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress();
        const failedReason = job.failedReason;

        res.json({
            jobId: job.id,
            state,
            progress,
            ...(failedReason && { error: failedReason })
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

module.exports = router;
