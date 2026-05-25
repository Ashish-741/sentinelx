/**
 * @fileoverview Authentication routes.
 */

import express from 'express';
import { register, login, forgotPassword, getMe, refreshToken, changePassword, generateApiKey, revokeApiKey } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerRules, loginRules, validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/seed-admin', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const existing = await User.findOne({ email: 'admin@sentinelx.io' });
    if (existing) {
      return res.status(200).send("Admin user already exists!");
    }
    await User.create({
      username: 'admin',
      email: 'admin@sentinelx.io',
      password: 'Admin@SentinelX2026',
      role: 'admin',
      isActive: true,
    });
    res.status(200).send("Admin user created successfully!");
  } catch (err) {
    res.status(500).send("Seed failed: " + err.message);
  }
});

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
