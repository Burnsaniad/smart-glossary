/**
 * Express application factory.
 *
 * Creates and configures the Express app with:
 * - Security headers (Helmet)
 * - CORS
 * - Request body parsing
 * - Cookie parsing
 * - HTTP logging (Morgan)
 * - Health check endpoint
 * - Centralised 404 and error handling
 *
 * The app is exported as a factory so tests can create isolated instances.
 */

import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, corsOrigins, isDatabaseConfigured } from './config/env.js';
import { notFoundHandler } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';

export function createApp() {
  const app = express();

  /* ── Security ───────────────────────────────────────────────────── */
  app.use(helmet());

  /* ── CORS ───────────────────────────────────────────────────────── */
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  /* ── Body / Cookie parsing ──────────────────────────────────────── */
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  /* ── HTTP logging ───────────────────────────────────────────────── */
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.MORGAN_FORMAT));
  }

  /* ── Health check ───────────────────────────────────────────────── */
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: isDatabaseConfigured ? 'configured' : 'not_configured',
    });
  });

  /* ── API v1 routes ──────────────────────────────────────────────── */
  app.use('/api/v1/auth', authRouter);

  /* ── 404 and error handling (must be last) ──────────────────────── */
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
