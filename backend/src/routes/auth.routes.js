/**
 * @fileoverview Authentication routes.
 */

import express from 'express';
import { register, login, forgotPassword, getMe, refreshToken, changePassword, generateApiKey, revokeApiKey } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerRules, loginRules, validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();


router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/me', protect, getMe);

// API Key Management
router.post('/api-keys', protect, generateApiKey);
router.delete('/api-keys/:keyId', protect, revokeApiKey);

export default router;
