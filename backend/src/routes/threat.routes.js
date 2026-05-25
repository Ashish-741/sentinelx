/**
 * @fileoverview Threat Intelligence routes.
 */

import express from 'express';
import { lookupIP, lookupDomain, getThreatFeed } from '../controllers/threatController.js';
import { protect } from '../middleware/auth.js';
import { threatIPRules, threatDomainRules, validate } from '../middleware/validate.js';
import { scanLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All threat routes require authentication and rate limiting
router.use(protect);
router.use(scanLimiter);

router.post('/ip', threatIPRules, validate, lookupIP);
router.post('/domain', threatDomainRules, validate, lookupDomain);
router.get('/feed', getThreatFeed);

export default router;
