/**
 * @fileoverview Express application setup with middleware and routes.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth.routes.js';
import scanRoutes from './routes/scan.routes.js';
import threatRoutes from './routes/threat.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Middleware
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware/rateLimiter.js';

const app = express();
app.use(cookieParser());

// ── SECURITY MIDDLEWARE ────────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin:
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173',
  credentials: true,
}));

// ── RATE LIMITING ────────────────────────────────────────────────────────
app.use('/api/', globalLimiter);

// ── LOGGING & PARSING MIDDLEWARE ────────────────────────────────────────
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── HEALTH CHECK ENDPOINT ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API ROUTES ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/threat', threatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 HANDLER ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ── ERROR HANDLER (MUST BE LAST) ────────────────────────────────────────────
app.use(errorHandler);

export default app;
