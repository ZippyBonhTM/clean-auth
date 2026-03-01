import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export default class AccessTokenExpiredError extends BaseDomainError {
  readonly code: string = 'ACCESS_TOKEN_EXPIRED';
  readonly statusCode: number = 401;
  constructor() {
    super("Access token is already expired");
  }
}