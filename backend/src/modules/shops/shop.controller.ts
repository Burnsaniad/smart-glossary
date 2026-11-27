import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { assignStaffSchema, createShopSchema, updateShopSchema } from './shop.schemas.js';
import {
  approveShop,
  assignStaff,
  getShop,
  listApprovedShops,
  listPendingShops,
  listStaff,
  registerShop,
  rejectShop,
  removeStaff,
  updateShop,
} from './shop.service.js';

function authUser(res: Response): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createShopSchema.parse(req.body);
    const shop = await registerShop(authUser(res).id, input);
    res.status(201).json(successResponse({ shop }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shops = await listApprovedShops();
    res.status(200).json(successResponse({ shops }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const shop = await getShop(shopId);
    res.status(200).json(successResponse({ shop }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const input = updateShopSchema.parse(req.body);
    const shop = await updateShop(authUser(res).id, shopId, input);
    res.status(200).json(successResponse({ shop }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function pending(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shops = await listPendingShops();
    res.status(200).json(successResponse({ shops }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const shop = await approveShop(authUser(res).id, shopId);
    res.status(200).json(successResponse({ shop }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const shop = await rejectShop(authUser(res).id, shopId);
    res.status(200).json(successResponse({ shop }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function addStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const input = assignStaffSchema.parse(req.body);
    const membership = await assignStaff(authUser(res).id, shopId, input);
    res.status(201).json(successResponse({ membership }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    const staffUserId = req.params.staffUserId;
    if (typeof shopId !== 'string' || typeof staffUserId !== 'string') {
      throw new Error('Shop and staff user ids are required');
    }
    await removeStaff(authUser(res).id, shopId, staffUserId);
    res.status(200).json(successResponse({ removed: true }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function staff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const shopId = req.params.shopId;
    if (typeof shopId !== 'string') throw new Error('Shop id is required');
    const memberships = await listStaff(authUser(res).id, shopId);
    res.status(200).json(successResponse({ staff: memberships }));
  } catch (error: unknown) {
    next(error);
  }
}
