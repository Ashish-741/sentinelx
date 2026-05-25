/**
 * @fileoverview Dashboard routes – stats, trends, recent scans.
 */

import express from 'express';
import {
  getStats,
  getThreatTrend,
  getRecentScans,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/trend', getThreatTrend);
router.get('/recent', getRecentScans);

export default router;
