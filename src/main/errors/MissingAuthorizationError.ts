import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export default class MissingAuthorizationError extends BaseDomainError {
  readonly code: string = "MISSING_AUTHORIZATION_ERROR";
  readonly statusCode: number = 401;
  constructor() {
    super("Missing authorization");
  }
}