import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export default class RefreshTokenExpiredError extends BaseDomainError {
  readonly code: string = 'REFRESH_TOKEN_EXPIRED';
  readonly statusCode: number = 401;
  constructor() {
    super("Refresh token is already expired");
  }
}