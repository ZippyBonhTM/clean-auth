import type { NextFunction, Request, Response } from 'express';
import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';
import { InvalidCredentialsError } from '@/application/usecases/errors/InvalidCredentialsError.js';
import { EmailAlreadyInUse } from '@/application/usecases/errors/EmailAlreadyInUse.js';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof InvalidCredentialsError || err instanceof EmailAlreadyInUse) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  if (err instanceof BaseDomainError) {
    res.status(500).json({ message: 'Domain error' });
    return;
  }
  res.status(500).json({ message: 'Internal server error' });
}