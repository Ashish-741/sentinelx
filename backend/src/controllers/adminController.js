/**
 * @fileoverview Admin controller – user management, analytics, audit logs.
 */

import User from '../models/User.js';
import Scan from '../models/Scan.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Escape special regex characters from user input to prevent ReDoS attacks.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated user list with search
 * @access  Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { username: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/ban
 * @desc    Toggle user isActive status (ban / unban)
 * @access  Admin
 */
export const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-ban
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot ban yourself.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: user.isActive ? 'USER_UNBAN' : 'USER_BAN',
      target: user.email,
      details: { targetUserId: id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info(
      `Admin ${req.user.email} ${user.isActive ? 'unbanned' : 'banned'} user ${user.email}`
    );

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'unbanned' : 'banned'} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/scans
 * @desc    Get all scans across all users (paginated)
 * @access  Admin
 */
export const getAllScans = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, riskLevel } = req.query;

    const filter = { isDeleted: false };
    if (type) filter.type = type;
    if (riskLevel) filter['result.riskLevel'] = riskLevel;

    const skip = (Number(page) - 1) * Number(limit);

    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Scan.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        scans,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/analytics
 * @desc    Get aggregate platform analytics
 * @access  Admin
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalScans,
      threatsByType,
      riskDistribution,
      dailyActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Scan.countDocuments({ isDeleted: false }),
      // Scans grouped by type
      Scan.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      // Scans grouped by risk level
      Scan.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$result.riskLevel', count: { $sum: 1 } } },
      ]),
      // Daily activity for the last 7 days
      Scan.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalScans,
        threatsByType: threatsByType.reduce(
          (acc, t) => ({ ...acc, [t._id]: t.count }),
          {}
        ),
        riskDistribution: riskDistribution.reduce(
          (acc, r) => ({ ...acc, [r._id || 'unknown']: r.count }),
          {}
        ),
        dailyActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/logs
 * @desc    Get paginated audit logs
 * @access  Admin
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/api-usage
 * @desc    Get API usage statistics (mock data for now)
 * @access  Admin
 */
export const getApiUsage = async (req, res, next) => {
  try {
    const urlScans = await Scan.countDocuments({ type: 'url', isDeleted: false });
    const ipScans = await Scan.countDocuments({ type: 'ip', isDeleted: false });
    const emailScans = await Scan.countDocuments({ type: 'email', isDeleted: false });

    const usage = {
      virusTotal: {
        dailyLimit: 500,
        used: urlScans,
        remaining: Math.max(0, 500 - urlScans),
        lastUsed: new Date().toISOString(),
      },
      abuseIPDB: {
        dailyLimit: 1000,
        used: ipScans,
        remaining: Math.max(0, 1000 - ipScans),
        lastUsed: new Date().toISOString(),
      },
      mlService: {
        status: 'online',
        totalRequests: emailScans + urlScans,
        avgResponseTime: `0.32s`,
      },
    };

    res.status(200).json({
      success: true,
      data: { usage },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
  banUser,
  getAllScans,
  getAnalytics,
  getAuditLogs,
  getApiUsage,
};
