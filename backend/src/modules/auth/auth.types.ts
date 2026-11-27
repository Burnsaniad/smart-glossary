import type { UserRole, UserStatus } from '../../generated/prisma/index.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}
