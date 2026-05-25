/**
 * @fileoverview Validation middleware and rule sets using express-validator.
 */

import { body, param, query, validationResult } from 'express-validator';

// ── Generic validation runner ────────────────────────────────────────
/**
 * Middleware that checks for express-validator errors and returns a
 * formatted 400 response if any exist.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    });
  }
  next();
};

// ── Rule sets ────────────────────────────────────────────────────────

/** Validation rules for user registration */
export const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

/** Validation rules for user login */
export const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/** Validation rules for URL scanning */
export const scanURLRules = [
  body('url')
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('A valid URL with protocol (http/https) is required'),
];

/** Validation rules for email scanning */
export const scanEmailRules = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Email text content is required')
    .isLength({ min: 10 })
    .withMessage('Email text must be at least 10 characters'),
];

/** Validation rules for threat IP lookup */
export const threatIPRules = [
  body('ip')
    .trim()
    .isIP()
    .withMessage('A valid IP address is required'),
];

/** Validation rules for threat domain lookup */
export const threatDomainRules = [
  body('domain')
    .trim()
    .isFQDN()
    .withMessage('A valid domain name is required'),
];

export default {
  validate,
  registerRules,
  loginRules,
  scanURLRules,
  scanEmailRules,
  threatIPRules,
  threatDomainRules,
};
