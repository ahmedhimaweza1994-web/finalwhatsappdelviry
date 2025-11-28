const express = require('express');
const ChatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chats
 * List all chats for current user
 */
router.get('/', authMiddleware, ChatController.listChats);

/**
 * GET /api/chats/:id
 * Get specific chat
 */
router.get('/:id', authMiddleware, ChatController.getChat);

/**
 * GET /api/chats/:id/messages
 * Get messages for a chat
 */
router.get('/:id/messages', authMiddleware, ChatController.getMessages);

/**
 * DELETE /api/chats/:id
 * Delete a chat
 */
router.delete('/:id', authMiddleware, ChatController.deleteChat);

/**
 * GET /api/chats/:id/search
 * Search messages in a chat
 */
router.get('/:id/search', authMiddleware, ChatController.searchMessages);

module.exports = router;
