import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export class InvalidCredentialsError extends BaseDomainError {
  readonly code: string = 'INVALID_CREDENTIALS';
  readonly statusCode: number = 401;

  constructor() {
    super('Invalid credentials provided');
  }
}