/**
 * 404 / not-found handler.
 *
 * Register this BEFORE the error handler but AFTER all routes so that
 * unmatched paths get a consistent JSON 404 rather than Express's HTML default.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError } from '../lib/errors.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('The requested resource was not found'));
}
