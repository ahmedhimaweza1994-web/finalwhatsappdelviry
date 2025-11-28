const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', AuthController.register);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', AuthController.login);

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware, AuthController.getProfile);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, AuthController.changePassword);

module.exports = router;
