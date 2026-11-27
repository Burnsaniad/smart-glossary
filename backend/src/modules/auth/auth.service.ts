import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { UserRole, UserStatus } from '../../generated/prisma/index.js';
import { env } from '../../config/env.js';
import { getPrisma } from '../../lib/db.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import type { AuthenticatedUser, AuthTokenPayload } from './auth.types.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const ACCESS_COOKIE_NAME = 'sgp_access';

export function getAccessCookieName(): string {
  return ACCESS_COOKIE_NAME;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function registerCustomer(input: RegisterInput): Promise<AuthenticatedUser> {
  const prisma = getPrisma();
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        ...(input.phone !== undefined && { phone: input.phone }),
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });

    return toPublicUser(user);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictError('An account with this email already exists');
    }
    throw error;
  }
}

export async function authenticate(input: LoginInput): Promise<AuthenticatedUser> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('This account is not active');
  }

  return toPublicUser(user);
}

export function createAccessToken(user: AuthenticatedUser): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role,
    status: user.status,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === 'string') {
    throw new UnauthorizedError('Invalid or expired session');
  }

  const candidate = payload as Partial<AuthTokenPayload>;
  if (
    typeof candidate.sub !== 'string' ||
    typeof candidate.role !== 'string' ||
    typeof candidate.status !== 'string' ||
    !Object.values(UserRole).includes(candidate.role) ||
    !Object.values(UserStatus).includes(candidate.status)
  ) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  return candidate as AuthTokenPayload;
}
