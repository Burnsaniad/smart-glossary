import { Router } from 'express';
import { requireAuthentication, requireRoles } from '../auth/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';
import { checkBudget, getBudget, setBudget } from './budget.controller.js';

export const budgetRouter = Router();

budgetRouter.use(requireAuthentication(), requireRoles(UserRole.CUSTOMER));
budgetRouter.put('/', setBudget);
budgetRouter.get('/current', getBudget);
budgetRouter.get('/:month', getBudget);
budgetRouter.post('/check', checkBudget);
