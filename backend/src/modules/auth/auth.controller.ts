import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from './auth.types.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import {
  authenticate,
  createAccessToken,
  getAccessCookieName,
  registerCustomer,
} from './auth.service.js';

function setAccessCookie(res: Response, token: string): void {
  res.cookie(getAccessCookieName(), token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true,
    maxAge: 15 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerCustomer(input);
    setAccessCookie(res, createAccessToken(user));
    res.status(201).json(successResponse({ user }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const user = await authenticate(input);
    setAccessCookie(res, createAccessToken(user));
    res.status(200).json(successResponse({ user }));
  } catch (error: unknown) {
    next(error);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(getAccessCookieName(), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true,
  });
  res.status(200).json(successResponse({ loggedOut: true }));
}

export function me(_req: Request, res: Response): void {
  const authUser = res.locals.authUser as AuthenticatedUser;
  res.status(200).json(successResponse({ user: authUser }));
}
