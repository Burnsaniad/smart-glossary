/**
 * Centralised error-handling middleware.
 *
 * Must be registered as the LAST middleware in app.ts (after all routes).
 * Converts AppError instances into consistent JSON responses.
 * Hides internal details (stack traces, Prisma internals) in production.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { errorResponse } from '../lib/response.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  /* ── Zod validation errors ─────────────────────────────────────── */
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(422).json(errorResponse('Validation failed', { code: 'VALIDATION_ERROR', issues }));
    return;
  }

  /* ── Known operational errors ──────────────────────────────────── */
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  /* ── Unknown / programming errors ─────────────────────────────── */
  const isDev = env.NODE_ENV === 'development';
  const message = isDev && err instanceof Error ? err.message : 'Internal server error';

  // Log the full error server-side only
  if (err instanceof Error) {
    process.stderr.write(`[error] Unhandled error: ${err.stack ?? err.message}\n`);
  } else {
    process.stderr.write(`[error] Unknown error thrown: ${String(err)}\n`);
  }

  res.status(500).json(errorResponse(message));
}
