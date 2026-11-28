import { Router } from 'express';
import { requireAuthentication, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';
import {
  createList,
  editItem,
  editList,
  getList,
  listLists,
  removeItem,
  removeList,
  upsertItem,
} from './grocery-list.controller.js';

export const groceryListRouter = Router();

groceryListRouter.use(requireAuthentication(), requireRoles(UserRole.CUSTOMER));
groceryListRouter.post('/', createList);
groceryListRouter.get('/', listLists);
groceryListRouter.get('/:listId', getList);
groceryListRouter.patch('/:listId', editList);
groceryListRouter.delete('/:listId', removeList);
groceryListRouter.post('/:listId/items', upsertItem);
groceryListRouter.patch('/:listId/items/:itemId', editItem);
groceryListRouter.delete('/:listId/items/:itemId', removeItem);
