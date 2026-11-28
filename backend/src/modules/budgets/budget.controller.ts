import type { NextFunction, Request, Response } from 'express';
import { successResponse } from '../../lib/response.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { checkMonthlyBudgetSchema, setMonthlyBudgetSchema } from './budget.schemas.js';
import {
  checkMonthlyBudget,
  currentMonth,
  getMonthlyBudget,
  setMonthlyBudget,
} from './budget.service.js';

function authUser(res: Response): AuthenticatedUser {
  return res.locals.authUser as AuthenticatedUser;
}

export async function setBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await setMonthlyBudget(authUser(res).id, setMonthlyBudgetSchema.parse(req.body));
    res.status(200).json(successResponse({ budget }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function getBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = typeof req.params.month === 'string' ? req.params.month : currentMonth();
    const budget = await getMonthlyBudget(authUser(res).id, month);
    res.status(200).json(successResponse({ month, budget }));
  } catch (error: unknown) {
    next(error);
  }
}

export async function checkBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await checkMonthlyBudget(
      authUser(res).id,
      checkMonthlyBudgetSchema.parse(req.body),
    );
    res.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
}
