import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export class InvalidTokenError extends BaseDomainError {
  readonly code: string = "INVALID_TOKEN_ERROR";
  readonly statusCode: number = 401;

  constructor() {
    super("Token inválido");
  }
}