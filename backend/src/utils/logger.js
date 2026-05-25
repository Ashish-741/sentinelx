/**
 * @fileoverview Simple console logger with timestamps and log levels.
 * Provides a unified logging interface across the application.
 */

const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format a log message with a timestamp and level.
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - The message to log
 * @returns {string} Formatted log string
 */
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

const logger = {
  /**
   * Log an informational message.
   * @param {string} message
   * @param  {...any} args
   */
  info(message, ...args) {
    console.log(formatMessage(LEVELS.INFO, message), ...args);
  },

  /**
   * Log a warning message.
   * @param {string} message
   * @param  {...any} args
   */
  warn(message, ...args) {
    console.warn(formatMessage(LEVELS.WARN, message), ...args);
  },

  /**
   * Log an error message.
   * @param {string} message
   * @param  {...any} args
   */
  error(message, ...args) {
    console.error(formatMessage(LEVELS.ERROR, message), ...args);
  },

  /**
   * Log a debug message (only in non-production environments).
   * @param {string} message
   * @param  {...any} args
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage(LEVELS.DEBUG, message), ...args);
    }
  },
};

export default logger;
