const express = require('express');
const router = express.Router();
const pinController = require('../controllers/pinController');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Toggle chat pin
router.post('/chats/:id/pin', pinController.toggleChatPin);

// Get pinned messages for a chat
router.get('/chats/:id/pinned-messages', pinController.getPinnedMessages);

// Toggle message pin
router.post('/chats/:chatId/messages/:messageId/pin', pinController.toggleMessagePin);

// Search messages in a chat
router.get('/chats/:id/search', pinController.searchMessages);

module.exports = router;
