import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { isDatabaseConfigured, env } from '../config/env.js';

function createPrismaClient(): PrismaClient {
  if (!isDatabaseConfigured || !env.DATABASE_URL) {
    throw new Error(
      '[db] DATABASE_URL is not configured. ' +
        'Set DATABASE_URL in .env before using the database.',
    );
  }

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({ adapter });
}

/**
 * Lazily initialised Prisma client.
 * Accessing this before DATABASE_URL is set will throw a descriptive error.
 */
let _prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  _prisma ??= createPrismaClient();
  return _prisma;
}
