import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  createGroceryListSchema,
  updateGroceryListSchema,
  upsertGroceryListItemSchema,
  updateGroceryListItemSchema,
} from './grocery-list.schemas.js';
import {
  createGroceryList,
  deleteGroceryList,
  deleteGroceryListItem,
  getGroceryList,
  listGroceryLists,
  updateGroceryList,
  updateGroceryListItem,
  upsertGroceryListItem,
} from './grocery-list.service.js';

function authUser(res: Response): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

function pathId(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  return value;
}

export async function createList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await createGroceryList(authUser(res).id, createGroceryListSchema.parse(req.body));
    res.status(201).json(successResponse({ list }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function listLists(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lists = await listGroceryLists(authUser(res).id);
    res.status(200).json(successResponse({ lists }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function getList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await getGroceryList(authUser(res).id, pathId(req, 'listId'));
    res.status(200).json(successResponse({ list }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function editList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await updateGroceryList(
      authUser(res).id,
      pathId(req, 'listId'),
      updateGroceryListSchema.parse(req.body),
    );
    res.status(200).json(successResponse({ list }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function removeList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteGroceryList(authUser(res).id, pathId(req, 'listId'));
    res.status(200).json(successResponse({ removed: true }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function upsertItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await upsertGroceryListItem(
      authUser(res).id,
      pathId(req, 'listId'),
      upsertGroceryListItemSchema.parse(req.body),
    );
    res.status(200).json(successResponse({ item }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function editItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await updateGroceryListItem(
      authUser(res).id,
      pathId(req, 'listId'),
      pathId(req, 'itemId'),
      updateGroceryListItemSchema.parse(req.body),
    );
    res.status(200).json(successResponse({ item }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteGroceryListItem(authUser(res).id, pathId(req, 'listId'), pathId(req, 'itemId'));
    res.status(200).json(successResponse({ removed: true }));
  } catch (error: unknown) {
    next(error);
  }
}
