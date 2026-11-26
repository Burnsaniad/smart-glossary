/**
 * Server entry point.
 *
 * Loads the app, starts listening, and handles graceful shutdown.
 * Does NOT import Prisma at the top level so the server can start
 * even when DATABASE_URL is not configured.
 */

import { createApp } from './app.js';
import { env, isDatabaseConfigured } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  process.stdout.write(
    `[server] Smart Grocery Planner API listening on port ${String(env.PORT)} ` +
      `(${env.NODE_ENV})\n`,
  );

  if (!isDatabaseConfigured) {
    process.stdout.write(
      '[server] WARNING: DATABASE_URL is not set. ' +
        'Database-dependent routes will not be available.\n',
    );
  }
});

/* ── Graceful shutdown ──────────────────────────────────────────── */
function shutdown(signal: string): void {
  process.stdout.write(`\n[server] ${signal} received. Shutting down gracefully…\n`);
  server.close(() => {
    process.stdout.write('[server] HTTP server closed.\n');
    process.exit(0);
  });

  // Force exit if the server hasn't closed within 10 seconds
  setTimeout(() => {
    process.stderr.write('[server] Forced exit after timeout.\n');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('uncaughtException', (err: Error) => {
  process.stderr.write(`[server] Uncaught exception: ${err.stack ?? err.message}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  process.stderr.write(`[server] Unhandled rejection: ${String(reason)}\n`);
  process.exit(1);
});

export { server };
