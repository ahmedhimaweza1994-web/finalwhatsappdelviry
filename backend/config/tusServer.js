const { S3Store } = require('@tus/server');
const path = require('path');
const fs = require('fs').promises;
const Chat = require('../models/Chat');
const parseQueue = require('../workers/parseWorker');

const datastore = new S3Store({
    partSize: 8 * 1024 * 1024, // 8MB
    directory: process.env.TUS_UPLOAD_DIR || '/tmp/tus-uploads'
});

const tusServer = {
    path: '/api/upload/tus',
    datastore,
    namingFunction: (req) => {
        return req.upload?.id || require('crypto').randomBytes(16).toString('hex');
    },
    onUploadFinish: async (req, res, upload) => {
        try {
            console.log('[Tus] Upload completed:', upload.id);

            // Get metadata from upload
            const metadata = upload.metadata || {};
            const userId = req.userId;
            const originalFilename = metadata.filename || 'chat.zip';
            const customChatName = metadata.customChatName; // Get custom name from metadata

            // Determine chat name priority: custom name > derived from filename > default
            let chatName;
            if (customChatName && customChatName.trim()) {
                chatName = customChatName.trim();
                console.log('[Tus] Using custom chat name:', chatName);
            } else {
                // Derive from filename
                const baseName = path.basename(originalFilename, path.extname(originalFilename));
                chatName = baseName.replace(/^WhatsApp Chat with\s+/i, '').trim() || `Chat ${new Date().toISOString().split('T')[0]}`;
                console.log('[Tus] Derived chat name from filename:', chatName);
            }

            // Move file from tus-temp to user directory
            const { v4: uuidv4 } = require('uuid');
            const uploadUuid = uuidv4();

            const userUploadDir = path.join(
                process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
                userId.toString(),
                uploadUuid
            );

            await fs.mkdir(userUploadDir, { recursive: true });

            const sourcePath = upload.storage?.path || path.join(datastore.directory, upload.id);
            const destPath = path.join(userUploadDir, 'raw.zip');

            await fs.rename(sourcePath, destPath);

            // Create chat record with the determined name
            const chat = await Chat.create(userId, chatName, originalFilename, uploadUuid);

            // Queue parse job
            const job = await parseQueue.add({
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

            console.log('[Tus] Parse job queued:', job.id);

        } catch (error) {
            console.error('[Tus] Error processing upload:', error);
        }
    }
};

module.exports = tusServer;
