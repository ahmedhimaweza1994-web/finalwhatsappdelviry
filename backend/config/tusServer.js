const { Server } = require('@tus/server');
const { FileStore } = require('@tus/file-store');
const path = require('path');
const Chat = require('../models/Chat');
const parseQueue = require('../workers/parseWorker');

const datastore = new FileStore({
    directory: path.join(process.env.UPLOADS_DIR || '/var/www/chatvault/uploads', 'tus-temp')
});

const tusServer = new Server({
    path: '/api/upload/tus',
    datastore,
    namingFunction: (req) => {
        const userId = req.userId || 'unknown';
        const timestamp = Date.now();
        return `${userId}-${timestamp}`;
    },
    onUploadFinish: async (req, res, upload) => {
        try {
            console.log('[Tus] Upload completed:', upload.id);

            // Get metadata from upload
            const metadata = upload.metadata || {};
            const userId = req.userId;
            const originalFilename = metadata.filename || 'chat.zip';
            const chatName = originalFilename.replace('.zip', '');

            // Move file from tus-temp to user directory
            const { v4: uuidv4 } = require('uuid');
            const uploadUuid = uuidv4();
            const fs = require('fs').promises;

            const userUploadDir = path.join(
                process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
                userId.toString(),
                uploadUuid
            );

            await fs.mkdir(userUploadDir, { recursive: true });

            const sourcePath = upload.storage?.path || path.join(datastore.directory, upload.id);
            const destPath = path.join(userUploadDir, 'raw.zip');

            await fs.rename(sourcePath, destPath);

            // Create chat record
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
});

module.exports = tusServer;
