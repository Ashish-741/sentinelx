/**
 * @fileoverview Authentication middleware – verifies JWT from the Authorization header.
 */

import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

/**
 * Express middleware that extracts and verifies a Bearer token.
 * On success, attaches the full user document to `req.user`.
 */
const auth = async (req, res, next) => {
  try {
    // 1. Extract API Key or JWT token
    const apiKey = req.headers['x-api-key'];
    let user;

    if (apiKey) {
      const hashedKey = hashApiKey(apiKey);
      user = await User.findOne({ 'apiKeys.key': hashedKey }).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid API Key.' });
      }
      // Update lastUsed timestamp async
      User.updateOne(
        { _id: user._id, 'apiKeys.key': hashedKey },
        { $set: { 'apiKeys.$.lastUsed': new Date() } }
      ).exec();
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token or API key provided.',
        });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Malformed token.',
        });
      }

      // 2. Verify token
      const decoded = verifyToken(token);

      // 3. Fetch user (exclude password)
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists.',
        });
      }
    }

    // 4. Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.debug(`Auth middleware error: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

export { auth as protect };
export default auth;
