/**
 * @fileoverview MongoDB connection configuration using Mongoose.
 * Handles connection events, retries, and error logging.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * Logs connection lifecycle events and throws on failure.
 * @returns {Promise<void>}
 */
export async function connectDB() {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/sentinelx';

  // ── Connection event listeners ──────────────────────────────────────
  mongoose.connection.on('connected', () => {
    logger.info('✅ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  try {
    await mongoose.connect(mongoURI, {
      // Mongoose 8 uses sensible defaults; override only what's needed
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    logger.info(`📦 MongoDB database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
}

export default { connectDB };
