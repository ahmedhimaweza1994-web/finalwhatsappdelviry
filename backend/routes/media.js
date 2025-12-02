const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const MediaFile = require('../models/MediaFile');

const router = express.Router();

/**
 * GET /api/media/:userId/:chatId/:filename
 * Serve media file with authentication
 */
router.get('/:userId/:chatId/:type/:filename', authMiddleware, async (req, res) => {
    try {
        const { userId, chatId, type, filename } = req.params;

        // Verify user owns this media
        if (parseInt(userId) !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Construct file path
        const filePath = path.join(
            process.env.MEDIA_DIR || '/var/www/chatvault/media',
            userId,
            chatId,
            type, // 'original' or 'thumbs'
            filename
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Get file stats for proper headers
        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();

        // Set content type based on extension
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.avi': 'video/x-msvideo',
            '.opus': 'audio/opus',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4',
            '.ogg': 'audio/ogg',
            '.pdf': 'application/pdf',
            '.zip': 'application/zip'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Set headers with CORS support for crossOrigin requests
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'private, max-age=31536000'); // Cache for 1 year
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

        // Handle range requests for video streaming
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunksize = (end - start) + 1;

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', chunksize);

            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        } else {
            // Stream entire file
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        }

    } catch (error) {
        console.error('Media serve error:', error);
        res.status(500).json({ error: 'Failed to serve media' });
    }
});

/**
 * GET /api/media/download/:mediaId
 * Download media file (force download)
 */
router.get('/download/:mediaId', authMiddleware, async (req, res) => {
    try {
        const media = await MediaFile.findById(req.params.mediaId, req.userId);

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        if (!fs.existsSync(media.storage_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(media.storage_path, media.original_name);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

module.exports = router;
