import { Router } from 'express';
import { requireAuthentication, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';
import {
  accept,
  approveChange,
  cancel,
  createChange,
  customerOrder,
  customerOrders,
  declineChange,
  place,
  prepare,
  ready,
  reject,
  shopOrder,
  shopOrders,
  updateItems,
} from './order.controller.js';

export const orderRouter = Router();
export const shopOrderRouter = Router();
export const changeRequestRouter = Router();

orderRouter.use(requireAuthentication());
orderRouter.post('/', requireRoles(UserRole.CUSTOMER), place);
orderRouter.get('/', requireRoles(UserRole.CUSTOMER), customerOrders);
orderRouter.get('/:orderId', requireRoles(UserRole.CUSTOMER), customerOrder);
orderRouter.patch('/:orderId/items', requireRoles(UserRole.CUSTOMER), updateItems);
orderRouter.delete('/:orderId', requireRoles(UserRole.CUSTOMER), cancel);

changeRequestRouter.use(requireAuthentication(), requireRoles(UserRole.CUSTOMER));
changeRequestRouter.patch('/:changeId/approve', approveChange);
changeRequestRouter.patch('/:changeId/decline', declineChange);

shopOrderRouter.use(
  requireAuthentication(),
  requireRoles(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF),
);
shopOrderRouter.get('/:shopId/orders', shopOrders);
shopOrderRouter.get('/:shopId/orders/:orderId', shopOrder);
shopOrderRouter.patch('/:shopId/orders/:orderId/accept', accept);
shopOrderRouter.patch('/:shopId/orders/:orderId/reject', reject);
shopOrderRouter.patch('/:shopId/orders/:orderId/prepare', prepare);
shopOrderRouter.patch('/:shopId/orders/:orderId/ready', ready);
shopOrderRouter.post('/:shopId/orders/:orderId/change-requests', createChange);
