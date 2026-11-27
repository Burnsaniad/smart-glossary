import { Router } from 'express';
import { requireAuthentication, requireRoles, requireShopAccess } from '../auth/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';
import {
  addCategory,
  addProduct,
  editCategory,
  editProduct,
  publicCategories,
  publicProduct,
  publicProducts,
  removeCategory,
  removeProduct,
  shopCategories,
  shopProducts,
} from './catalogue.controller.js';

export const catalogueRouter = Router();

catalogueRouter.get('/:shopId/categories', publicCategories);
catalogueRouter.get('/:shopId/products', publicProducts);
catalogueRouter.get('/:shopId/products/:productId', publicProduct);

catalogueRouter.get(
  '/:shopId/manage/categories',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  shopCategories,
);
catalogueRouter.post(
  '/:shopId/categories',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  addCategory,
);
catalogueRouter.patch(
  '/:shopId/categories/:categoryId',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  editCategory,
);
catalogueRouter.delete(
  '/:shopId/categories/:categoryId',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  removeCategory,
);

catalogueRouter.get(
  '/:shopId/manage/products',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  shopProducts,
);
catalogueRouter.post(
  '/:shopId/products',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  addProduct,
);
catalogueRouter.patch(
  '/:shopId/products/:productId',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  editProduct,
);
catalogueRouter.delete(
  '/:shopId/products/:productId',
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
  requireShopAccess(),
  removeProduct,
);
