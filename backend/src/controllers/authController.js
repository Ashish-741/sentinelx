/**
 * @fileoverview Auth controller – registration, login, profile management.
 */

import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import AuditLog from '../models/AuditLog.js';
import { signToken, signRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

const hashApiKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
    }

    // Create user
    const user = await User.create({ username, email, password });

    // Generate tokens
    const accessToken = signToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id });

    // Store refresh token in DB
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_REGISTER',
      target: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: user.toJSON(),
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = signToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id });

    // Invalidate old refresh tokens to prevent unbounded growth (optional, but good practice)
    await RefreshToken.deleteMany({ user: user._id });

    // Store new refresh token
    await RefreshToken.create({
      token: refreshToken, 
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      target: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Placeholder forgot-password flow
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Always return success to prevent email enumeration
    const user = await User.findOne({ email });
    if (user) {
      logger.info(`Password reset requested for: ${email}`);
      // TODO: implement actual email sending
    }

    res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile (username/email)
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (email) updates.email = email;

    // Check for conflicts
    if (username || email) {
      const conflict = await User.findOne({
        _id: { $ne: req.user._id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (conflict) {
        const field = conflict.username === username ? 'username' : 'email';
        return res.status(409).json({
          success: false,
          message: `This ${field} is already taken.`,
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'PROFILE_UPDATE',
      target: req.user.email,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Get new access token using refresh token
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    // Verify token validity
    const decoded = verifyRefreshToken(token);
    
    // Check if it exists in DB and is active
    const tokenDoc = await RefreshToken.findOne({ token, user: decoded.userId });
    if (!tokenDoc || tokenDoc.isExpired || tokenDoc.revoked) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    // Issue new tokens (rotating the refresh token)
    const newAccessToken = signToken({ userId: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user._id });

    tokenDoc.revoked = new Date();
    tokenDoc.replacedByToken = newRefreshToken;
    await tokenDoc.save();

    await RefreshToken.create({
      token: newRefreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: { token: newAccessToken },
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    // Revoke all existing refresh tokens so they have to log in again on other devices
    await RefreshToken.updateMany({ user: user._id }, { revoked: new Date() });

    await AuditLog.create({
      userId: user._id,
      action: 'PASSWORD_CHANGE',
      target: user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully updated. Other devices have been logged out.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/api-keys
 * @desc    Generate a new API key for the current user
 * @access  Private
 */
export const generateApiKey = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user.apiKeys && user.apiKeys.length >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum of 5 API keys allowed.' });
    }

    const newKey = 'snx_' + crypto.randomBytes(32).toString('hex');
    
    user.apiKeys.push({
      key: hashApiKey(newKey),
      name: name || 'Default Key',
      createdAt: new Date()
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: { key: newKey }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/api-keys/:keyId
 * @desc    Revoke an API key
 * @access  Private
 */
export const revokeApiKey = async (req, res, next) => {
  try {
    const { keyId } = req.params;
    const user = await User.findById(req.user._id);
    
    user.apiKeys = user.apiKeys.filter(k => k._id.toString() !== keyId && k.key !== keyId);
    await user.save();
    
    res.status(200).json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    next(error);
  }
};

export default { register, login, getMe, forgotPassword, updateProfile, refreshToken, changePassword, generateApiKey, revokeApiKey };
