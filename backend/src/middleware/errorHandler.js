/**
 * @fileoverview Global error-handling middleware.
 * Catches all errors thrown or passed via next(err) and returns a
 * consistent JSON response. Handles Mongoose and JWT specific errors.
 */

import logger from '../utils/logger.js';

/**
 * Express error-handling middleware (4-argument signature).
 */
const errorHandler = (err, req, res, _next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}`);
  logger.debug(err.stack || '');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // ── Mongoose Validation Error ────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose Duplicate Key Error ─────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}. This ${field} is already in use.`;
  }

  // ── Mongoose Cast Error (invalid ObjectId, etc.) ─────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT Errors ───────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  // Build response
  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
