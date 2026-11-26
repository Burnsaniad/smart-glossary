/**
 * Environment configuration with Zod validation.
 *
 * All required env vars are defined here. The server will fail fast
 * with a readable error if a required variable is missing or malformed,
 * rather than crashing with an obscure runtime error later.
 *
 * DATABASE_URL is optional during development so the server can still
 * start and serve non-DB routes (e.g. health check) without a live DB.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  /* DB is optional so the server can run without a database in dev/test */
  DATABASE_URL: z.url().optional().or(z.literal('')),

  /* Auth */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  /* CORS */
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  /* Cookies */
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),

  /* Rate limiting */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),

  /* Logging */
  MORGAN_FORMAT: z.enum(['combined', 'dev', 'tiny', 'short', 'common']).default('dev'),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    // Using process.stderr directly here because logger depends on env
    process.stderr.write(`\n[env] Invalid environment variables:\n${formatted}\n\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();

/** Parsed CORS_ORIGINS as an array */
export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Whether the database URL is configured */
export const isDatabaseConfigured =
  typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.length > 0;
