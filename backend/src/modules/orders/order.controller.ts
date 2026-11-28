import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  changeResponseSchema,
  changeRequestSchema,
  placeOrderSchema,
  updateOrderItemsSchema,
} from './order.schemas.js';
import {
  acceptOrder,
  approveChangeRequest,
  cancelOrder,
  createChangeRequest,
  declineChangeRequest,
  getCustomerOrder,
  getShopOrder,
  listCustomerOrders,
  listShopOrders,
  placeOrder,
  rejectOrder,
  startPreparation,
  markReady,
  updateOrderItems,
} from './order.service.js';

function authUser(res: Response): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

function pathId(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  return value;
}

export async function place(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await placeOrder(authUser(res).id, placeOrderSchema.parse(req.body));
    res.status(201).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function customerOrders(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orders = await listCustomerOrders(authUser(res).id);
    res.status(200).json(successResponse({ orders }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function customerOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const order = await getCustomerOrder(authUser(res).id, pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function updateItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await updateOrderItems(
      authUser(res).id,
      pathId(req, 'orderId'),
      updateOrderItemsSchema.parse(req.body),
    );
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await cancelOrder(authUser(res).id, pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function shopOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await listShopOrders(authUser(res), pathId(req, 'shopId'));
    res.status(200).json(successResponse({ orders }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function shopOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await getShopOrder(authUser(res), pathId(req, 'shopId'), pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await acceptOrder(authUser(res), pathId(req, 'shopId'), pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await rejectOrder(authUser(res), pathId(req, 'shopId'), pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function prepare(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await startPreparation(
      authUser(res),
      pathId(req, 'shopId'),
      pathId(req, 'orderId'),
    );
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function ready(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await markReady(authUser(res), pathId(req, 'shopId'), pathId(req, 'orderId'));
    res.status(200).json(successResponse({ order }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function createChange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const change = await createChangeRequest(
      authUser(res),
      pathId(req, 'shopId'),
      pathId(req, 'orderId'),
      changeRequestSchema.parse(req.body),
    );
    res.status(201).json(successResponse({ change }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function approveChange(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await approveChangeRequest(
      authUser(res).id,
      pathId(req, 'changeId'),
      changeResponseSchema.parse(req.body),
    );
    res.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
}

export async function declineChange(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await declineChangeRequest(
      authUser(res).id,
      pathId(req, 'changeId'),
      changeResponseSchema.parse(req.body),
    );
    res.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
}
