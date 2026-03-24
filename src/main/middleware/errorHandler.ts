import type { NextFunction, Request, Response } from 'express';
import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';
import RefreshTokenExpiredError from '@/application/protocols/errors/RefreshTokenExpiredError.js';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof RefreshTokenExpiredError) {
    res
      .clearCookie("refreshToken")
      .status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }
  if (err instanceof BaseDomainError) {
    res.status(err.statusCode).json({ message: err.message, code: err.code });
    return;
  }
  res.status(500).json({ message: 'Internal server error' });
  return;
}
