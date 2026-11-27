import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import {
  createCategorySchema,
  createProductSchema,
  updateCategorySchema,
  updateProductSchema,
} from './catalogue.schemas.js';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getPublicProduct,
  listPublicCategories,
  listPublicProducts,
  listShopCategories,
  listShopProducts,
  updateCategory,
  updateProduct,
} from './catalogue.service.js';

function authUser(res: Response): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

function pathId(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  return value;
}

export async function publicCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listPublicCategories(pathId(req, 'shopId'));
    res.status(200).json(successResponse({ categories }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function publicProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const products = await listPublicProducts(pathId(req, 'shopId'));
    res.status(200).json(successResponse({ products }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function publicProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await getPublicProduct(pathId(req, 'shopId'), pathId(req, 'productId'));
    res.status(200).json(successResponse({ product }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function addCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await createCategory(
      pathId(req, 'shopId'),
      createCategorySchema.parse(req.body),
    );
    res.status(201).json(successResponse({ category }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function shopCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listShopCategories(pathId(req, 'shopId'));
    res.status(200).json(successResponse({ categories }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function editCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await updateCategory(
      pathId(req, 'shopId'),
      pathId(req, 'categoryId'),
      updateCategorySchema.parse(req.body),
    );
    res.status(200).json(successResponse({ category }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function removeCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteCategory(pathId(req, 'shopId'), pathId(req, 'categoryId'));
    res.status(200).json(successResponse({ removed: true }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function addProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await createProduct(pathId(req, 'shopId'), createProductSchema.parse(req.body));
    res.status(201).json(successResponse({ product }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function shopProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await listShopProducts(pathId(req, 'shopId'));
    res.status(200).json(successResponse({ products }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function editProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = authUser(res);
    const product = await updateProduct(
      pathId(req, 'shopId'),
      pathId(req, 'productId'),
      user.role,
      updateProductSchema.parse(req.body),
    );
    res.status(200).json(successResponse({ product }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function removeProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteProduct(pathId(req, 'shopId'), pathId(req, 'productId'));
    res.status(200).json(successResponse({ removed: true }));
  } catch (error: unknown) {
    next(error);
  }
}
