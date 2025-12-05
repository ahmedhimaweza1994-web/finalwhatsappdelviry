const Chat = require('../models/Chat');
const Message = require('../models/Message');
const MediaFile = require('../models/MediaFile');
const fs = require('fs').promises;
const path = require('path');

class ChatController {
    /**
     * GET /api/chats
     * List all chats for current user
     */
    static async listChats(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            const chats = await Chat.findByUser(req.userId, limit, offset);
            const totalCount = await Chat.count(req.userId);

            res.json({
                chats,
                total: totalCount,
                limit,
                offset
            });
        } catch (error) {
            console.error('List chats error:', error);
            res.status(500).json({ error: 'Failed to load chats' });
        }
    }

    /**
     * GET /api/chats/:id
     * Get  chat details
     */
    static async getChat(req, res) {
        try {
            const chat = await Chat.findById(req.params.id, req.userId);

            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            res.json({ chat });
        } catch (error) {
            console.error('Get chat error:', error);
            res.status(500).json({ error: 'Failed to load chat' });
        }
    }

    /**
     * GET /api/chats/:id/messages
     * Get messages for a chat (paginated)
     */
    static async getMessages(req, res) {
        try {
            const chatId = req.params.id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;

            // Verify chat belongs to user
            const chat = await Chat.findById(chatId, req.userId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const messages = await Message.findByChatPaginated(chatId, limit, offset);
            const totalCount = await Message.countByChat(chatId);

            res.json({
                messages,
                total: totalCount,
                limit,
                offset,
                hasMore: offset + messages.length < totalCount
            });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ error: 'Failed to load messages' });
        }
    }

    /**
     * DELETE /api/chats/:id
     * Delete a chat and all associated data
     */
    static async deleteChat(req, res) {
        try {
            const chatId = req.params.id;

            // Verify chat belongs to user
            const chat = await Chat.findById(chatId, req.userId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            // Get all media files for deletion
            const mediaFiles = await MediaFile.findByChat(chatId);

            // Delete media files from disk
            for (const media of mediaFiles) {
                try {
                    await fs.unlink(media.storage_path);
                    if (media.thumb_path) {
                        await fs.unlink(media.thumb_path);
                    }
                } catch (error) {
                    console.error(`Failed to delete media file ${media.storage_path}:`, error);
                }
            }

            // Delete from database (cascade will handle messages and media_files)
            await Chat.delete(chatId, req.userId);

            // Delete upload directory
            const uploadDir = path.join(
                process.env.UPLOADS_DIR || '/var/www/chatvault/uploads',
                req.userId.toString(),
                chat.upload_uuid
            );

            try {
                await fs.rm(uploadDir, { recursive: true, force: true });
            } catch (error) {
                console.error(`Failed to delete upload directory:`, error);
            }

            res.json({ message: 'Chat deleted successfully' });
        } catch (error) {
            console.error('Delete chat error:', error);
            res.status(500).json({ error: 'Failed to delete chat' });
        }
    }

    /**
     * GET /api/chats/:id/search
     * Search messages in a chat
     */
    static async searchMessages(req, res) {
        try {
            const chatId = req.params.id;
            const query = req.query.q;

            if (!query) {
                return res.status(400).json({ error: 'Search query required' });
            }

            // Verify chat belongs to user
            const chat = await Chat.findById(chatId, req.userId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }

            const searchData = await Message.searchInChat(chatId, query);

            res.json({
                success: true,
                matchingMessageIds: searchData.matchingMessageIds,
                totalOccurrences: searchData.totalOccurrences,
                totalMessages: searchData.totalMessages,
                query
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
}

module.exports = ChatController;
