/**
 * @fileoverview SentinelX Backend Server - Entry Point
 * Loads environment variables, connects to MongoDB, and starts the Express server.
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import logger from './src/utils/logger.js';
import { initSocket } from './src/utils/socket.js';

const PORT = process.env.PORT || 5000;

/**
 * Start the server after establishing a database connection.
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 SentinelX API server running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    // Initialize Socket.io
    initSocket(server);

    // ── Graceful Shutdown ──────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown – could not close connections in time.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      shutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();
