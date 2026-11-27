import { Router } from 'express';
import { requireAuthentication, requireRoles, requireShopOwner } from '../auth/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';
import {
  addStaff,
  approve,
  get,
  list,
  pending,
  register,
  reject,
  remove,
  staff,
  update,
} from './shop.controller.js';

export const shopRouter = Router();
export const adminShopRouter = Router();

shopRouter.get('/', list);
shopRouter.get('/:shopId', get);
shopRouter.post(
  '/',
  requireAuthentication(),
  requireRoles(UserRole.CUSTOMER, UserRole.SHOP_OWNER),
  register,
);
shopRouter.patch('/:shopId', requireAuthentication(), requireShopOwner(), update);
shopRouter.get('/:shopId/staff', requireAuthentication(), requireShopOwner(), staff);
shopRouter.post('/:shopId/staff', requireAuthentication(), requireShopOwner(), addStaff);
shopRouter.delete(
  '/:shopId/staff/:staffUserId',
  requireAuthentication(),
  requireShopOwner(),
  remove,
);

adminShopRouter.get(
  '/shops/pending',
  requireAuthentication(),
  requireRoles(UserRole.ADMIN),
  pending,
);
adminShopRouter.patch(
  '/shops/:shopId/approve',
  requireAuthentication(),
  requireRoles(UserRole.ADMIN),
  approve,
);
adminShopRouter.patch(
  '/shops/:shopId/reject',
  requireAuthentication(),
  requireRoles(UserRole.ADMIN),
  reject,
);
