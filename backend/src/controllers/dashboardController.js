/**
 * @fileoverview Dashboard controller – user-facing statistics, trends, and recent activity.
 */

import Scan from '../models/Scan.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics for the authenticated user
 * @access  Private
 */
export const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalScans, threatBreakdown, recentDangerous] = await Promise.all([
      Scan.countDocuments({ userId, isDeleted: false }),
      Scan.aggregate([
        { $match: { userId, isDeleted: false } },
        { $group: { _id: '$result.riskLevel', count: { $sum: 1 } } },
      ]),
      Scan.countDocuments({
        userId,
        isDeleted: false,
        'result.riskLevel': 'dangerous',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const breakdown = threatBreakdown.reduce(
      (acc, item) => ({ ...acc, [item._id || 'unknown']: item.count }),
      { safe: 0, suspicious: 0, dangerous: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        threatsDetected: (breakdown.suspicious || 0) + (breakdown.dangerous || 0),
        dangerousLast30Days: recentDangerous,
        riskBreakdown: breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/trend
 * @desc    Get 7-day threat trend data for the authenticated user
 * @access  Private
 */
export const getThreatTrend = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trend = await Scan.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            riskLevel: '$result.riskLevel',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Build a structured day-by-day breakdown
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: key, safe: 0, suspicious: 0, dangerous: 0, total: 0 };
    }

    trend.forEach(({ _id, count }) => {
      if (days[_id.date]) {
        days[_id.date][_id.riskLevel || 'safe'] += count;
        days[_id.date].total += count;
      }
    });

    res.status(200).json({
      success: true,
      data: { trend: Object.values(days) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/recent
 * @desc    Get the last 10 scans for the authenticated user
 * @access  Private
 */
export const getRecentScans = async (req, res, next) => {
  try {
    const scans = await Scan.find({ userId: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: { scans },
    });
  } catch (error) {
    next(error);
  }
};

export default { getStats, getThreatTrend, getRecentScans };
