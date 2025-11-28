const Queue = require('bull');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const zipParser = require('../services/zipParser');
const chatParser = require('../services/chatParser');
const mediaMapper = require('../services/mediaMapper');
const thumbnailGenerator = require('../services/thumbnailGenerator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const MediaFile = require('../models/MediaFile');

// Create Bull queue
const parseQueue = new Queue('chat-parse', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

/**
 * Parse Worker
 * Background job processor for parsing WhatsApp ZIP exports
 */

// Process jobs
parseQueue.process(async (job) => {
    const { userId, chatId, zipPath, uploadUuid } = job.data;

    try {
        console.log(`[Worker] Starting parse job for chat ${chatId}`);

        // Step 1: Extract ZIP (10%)
        await job.progress(10);
        const extractPath = path.join(
            process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
            userId.toString(),
            uploadUuid,
            'extracted'
        );

        console.log(`[Worker] Extracting ZIP to ${extractPath}`);
        await zipParser.extract(zipPath, extractPath);

        // Step 2: Find chat file and media (20%)
        await job.progress(20);
        console.log(`[Worker] Finding chat file and media`);
        const chatFile = await zipParser.findChatFile(extractPath);
        const mediaFiles = await zipParser.findMediaFiles(extractPath);
        const chatName = zipParser.getChatName(chatFile);

        // Update chat name
        await Chat.updateParseStatus(chatId, 'processing');
        await Chat.updateStats(chatId, 0, await zipParser.getDirectorySize(extractPath));

        // Step 3: Parse chat .txt (40%)
        await job.progress(40);
        console.log(`[Worker] Parsing chat file: ${chatFile}`);
        let parsedMessages = await chatParser.parse(chatFile);

        // Identify "me" sender
        parsedMessages = chatParser.identifySender(parsedMessages, chatName);

        console.log(`[Worker] Parsed ${parsedMessages.length} messages`);

        // Step 4: Map media to messages (60%)
        await job.progress(60);
        console.log(`[Worker] Mapping ${mediaFiles.length} media files to messages`);
        const mappedMessages = await mediaMapper.mapMedia(parsedMessages, mediaFiles);

        // Step 5: Move media files and generate thumbnails (70%)
        await job.progress(70);
        const mediaRecords = [];
        const thumbnailJobs = [];

        for (const message of mappedMessages) {
            if (message.mediaPath) {
                // Generate storage paths
                const storagePath = mediaMapper.generateStoragePath(
                    userId,
                    chatId,
                    path.basename(message.mediaPath)
                );
                const thumbPath = mediaMapper.generateThumbPath(storagePath);

                // Ensure directory exists
                await fs.mkdir(path.dirname(storagePath), { recursive: true });

                // Copy media file to permanent storage
                await fs.copyFile(message.mediaPath, storagePath);

                // Add to media records
                message.permanentMediaPath = storagePath;
                message.thumbPath = thumbPath;

                // Schedule thumbnail generation
                if (message.mimeType &&
                    (message.mimeType.startsWith('image/') || message.mimeType.startsWith('video/'))) {
                    thumbnailJobs.push({
                        sourcePath: storagePath,
                        thumbPath,
                        mimeType: message.mimeType
                    });
                }
            }
        }

        // Generate thumbnails in batch
        if (thumbnailJobs.length > 0) {
            console.log(`[Worker] Generating ${thumbnailJobs.length} thumbnails`);
            await thumbnailGenerator.generateBatch(thumbnailJobs);
        }

        // Step 6: Save to database (85%)
        await job.progress(85);
        console.log(`[Worker] Saving messages to database`);

        // Prepare message data
        const messageData = mappedMessages.map((msg, index) => ({
            chatId,
            senderName: msg.senderName,
            senderIsMe: msg.senderIsMe,
            timestamp: msg.timestamp,
            body: msg.body || '',
            messageType: msg.messageType,
            orderIndex: msg.orderIndex,
            metadata: msg.metadata || {}
        }));

        // Bulk insert messages
        const savedMessages = await Message.bulkCreate(messageData);

        // Prepare media data
        const mediaToInsert = [];
        for (let i = 0; i < mappedMessages.length; i++) {
            const msg = mappedMessages[i];
            if (msg.permanentMediaPath) {
                mediaToInsert.push({
                    messageId: savedMessages[i].id,
                    chatId,
                    userId,
                    originalName: path.basename(msg.mediaPath),
                    storagePath: msg.permanentMediaPath,
                    thumbPath: msg.thumbPath,
                    mimeType: msg.mimeType,
                    sizeBytes: msg.mediaSize || 0
                });
            }
        }

        // Bulk insert media
        if (mediaToInsert.length > 0) {
            await MediaFile.bulkCreate(mediaToInsert);
        }

        // Step 7: Update chat status (100%)
        await job.progress(100);
        await Chat.updateParseStatus(chatId, 'completed');
        await db.query(
            'UPDATE chats SET chat_name = $1 WHERE id = $2',
            [chatName, chatId]
        );

        // Clean up temporary extraction directory
        await zipParser.cleanup(extractPath);

        console.log(`[Worker] Parse job completed for chat ${chatId}`);

        return {
            success: true,
            chatId,
            messageCount: savedMessages.length,
            mediaCount: mediaToInsert.length
        };

    } catch (error) {
        console.error(`[Worker] Parse job failed for chat ${chatId}:`, error);

        // Update chat with error status
        await Chat.updateParseStatus(chatId, 'failed', error.message);

        throw error;
    }
});

// Event handlers
parseQueue.on('completed', (job, result) => {
    console.log(`[Queue] Job ${job.id} completed:`, result);
});

parseQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

parseQueue.on('progress', (job, progress) => {
    console.log(`[Queue] Job ${job.id} progress: ${progress}%`);
});

// If running as standalone worker
if (require.main === module) {
    console.log('🚀 Parse worker started');
    console.log(`   Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, closing worker...');
        await parseQueue.close();
        process.exit(0);
    });
}

module.exports = parseQueue;
