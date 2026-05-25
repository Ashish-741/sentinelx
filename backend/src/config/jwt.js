/**
 * @fileoverview JWT helper utilities for signing and verifying tokens.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = () => process.env.JWT_SECRET || 'sentinelx-dev-secret-change-me';
const REFRESH_SECRET = () => process.env.REFRESH_SECRET || 'sentinelx-refresh-secret-change-me';
const JWT_EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access
const REFRESH_EXPIRES_IN = () => process.env.REFRESH_EXPIRES_IN || '7d';

/**
 * Sign an Access JWT.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: JWT_EXPIRES_IN() });
}

/**
 * Sign a Refresh JWT.
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: REFRESH_EXPIRES_IN() });
}

/**
 * Verify and decode an Access JWT.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET());
}

/**
 * Verify and decode a Refresh JWT.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET());
}

export default { signToken, signRefreshToken, verifyToken, verifyRefreshToken };
