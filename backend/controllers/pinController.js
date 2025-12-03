const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Toggle chat pin status
exports.toggleChatPin = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chat = await Chat.togglePin(id, userId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({
            success: true,
            chat,
            message: chat.is_pinned ? 'Chat pinned' : 'Chat unpinned'
        });
    } catch (error) {
        console.error('Error toggling chat pin:', error);
        res.status(500).json({ error: 'Failed to toggle chat pin' });
    }
};

// Toggle message pin status
exports.toggleMessagePin = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const userId = req.user.id;

        // Verify user owns this chat
        const chat = await Chat.findById(chatId, userId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const message = await Message.togglePin(messageId, chatId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({
            success: true,
            message,
            pinnedStatus: message.is_pinned
        });
    } catch (error) {
        console.error('Error toggling message pin:', error);
        res.status(500).json({ error: 'Failed to toggle message pin' });
    }
};

// Get all pinned messages for a chat
exports.getPinnedMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify user owns this chat
        const chat = await Chat.findById(id, userId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const pinnedMessages = await Message.getPinnedMessages(id);

        res.json({
            success: true,
            messages: pinnedMessages,
            count: pinnedMessages.length
        });
    } catch (error) {
        console.error('Error getting pinned messages:', error);
        res.status(500).json({ error: 'Failed to get pinned messages' });
    }
};

// Search messages in a chat
exports.searchMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { q } = req.query;
        const userId = req.user.id;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Verify user owns this chat
        const chat = await Chat.findById(id, userId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const results = await Message.searchInChat(id, q.trim());

        res.json({
            success: true,
            results,
            count: results.length,
            query: q
        });
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ error: 'Failed to search messages' });
    }
};
