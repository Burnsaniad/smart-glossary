import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole, UserStatus } from '../../generated/prisma/index.js';
import { getPrisma } from '../../lib/db.js';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.js';
import type { AuthenticatedUser } from './auth.types.js';
import { getAccessCookieName, verifyAccessToken } from './auth.service.js';

export function requireAuthentication(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieName = getAccessCookieName();
      const signedCookies = (req as unknown as { signedCookies?: Record<string, unknown> })
        .signedCookies;
      const signedCookie = signedCookies?.[cookieName];
      const bearer = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined;
      const token = typeof signedCookie === 'string' ? signedCookie : bearer;

      if (!token) {
        throw new UnauthorizedError('Authentication required');
      }

      const payload = verifyAccessToken(token);
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (user?.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('Invalid or expired session');
      }

      res.locals.authUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      } satisfies AuthenticatedUser;
      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}

export function requireRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const authUser = res.locals.authUser as AuthenticatedUser | undefined;
    if (!authUser) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (!allowedRoles.includes(authUser.role)) {
      next(new ForbiddenError('Insufficient role permissions'));
      return;
    }
    next();
  };
}

export function requireShopOwner(shopIdParam = 'shopId'): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = res.locals.authUser as AuthenticatedUser | undefined;
      if (!authUser) {
        throw new UnauthorizedError('Authentication required');
      }
      if (authUser.role !== UserRole.SHOP_OWNER) {
        throw new ForbiddenError('Shop owner role required');
      }

      const shopIdParamValue = req.params[shopIdParam];
      if (typeof shopIdParamValue !== 'string') {
        throw new ForbiddenError('Shop is required');
      }
      const shopId = shopIdParamValue;

      const prisma = getPrisma();
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true },
      });
      if (shop?.ownerId !== authUser.id) {
        throw new ForbiddenError('You do not own this shop');
      }
      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}

export function requireShopAccess(shopIdParam = 'shopId'): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authUser = res.locals.authUser as AuthenticatedUser | undefined;
      if (!authUser) {
        throw new UnauthorizedError('Authentication required');
      }

      const shopIdParamValue = req.params[shopIdParam];
      if (typeof shopIdParamValue !== 'string') {
        throw new ForbiddenError('Shop is required');
      }
      const shopId = shopIdParamValue;

      const prisma = getPrisma();
      if (authUser.role === UserRole.SHOP_OWNER) {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { ownerId: true },
        });
        if (shop?.ownerId === authUser.id) {
          next();
          return;
        }
      }

      if (authUser.role === UserRole.SHOP_STAFF) {
        const membership = await prisma.shopStaff.findUnique({
          where: { userId: authUser.id },
          select: { shopId: true },
        });
        if (membership?.shopId === shopId) {
          next();
          return;
        }
      }

      throw new ForbiddenError('You do not have access to this shop');
    } catch (error: unknown) {
      next(error);
    }
  };
}
