/**
 * @fileoverview Database seed script – creates default admin user.
 * Run: npm run seed (from backend directory)
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import logger from './logger.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sentinelx.io';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@SentinelX2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

async function seed() {
  try {
    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      logger.info(`Admin user already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
    });

    logger.info(`Admin user created: ${ADMIN_EMAIL}`);
    logger.info(`Default password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
}

seed();
