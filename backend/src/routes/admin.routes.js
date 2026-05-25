/**
 * @fileoverview Admin routes – user management, analytics, audit logs.
 */

import express from 'express';
import { getUsers, banUser, getAllScans, getAnalytics, getAuditLogs, getApiUsage } from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(roleGuard('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.get('/scans', getAllScans);
router.get('/analytics', getAnalytics);
router.get('/logs', getAuditLogs);
router.get('/api-usage', getApiUsage);

export default router;
