/**
 * @fileoverview Scan (URL & Email) routes.
 */

import express from 'express';
import { scanURL, scanEmail, getScanHistory, getScanById, deleteScan, scanBatch } from '../controllers/scanController.js';
import { protect } from '../middleware/auth.js';
import { scanURLRules, scanEmailRules, validate } from '../middleware/validate.js';
import { generateScanPDF } from '../controllers/reportController.js';
import { scanLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All scan routes require authentication
router.use(protect);
router.use(scanLimiter);

router.post('/url', scanURLRules, validate, scanURL);
router.post('/email', scanEmailRules, validate, scanEmail);
router.post('/batch', scanBatch);
router.get('/history', getScanHistory);
router.get('/:id/pdf', generateScanPDF);
router.get('/:id', getScanById);
router.delete('/:id', deleteScan);

export default router;
