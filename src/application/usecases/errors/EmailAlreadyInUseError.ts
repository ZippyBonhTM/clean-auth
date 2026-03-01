import { BaseDomainError } from '@/domain/errors/BaseDomainError.js';

export class EmailAlreadyInUseError extends BaseDomainError {
  readonly code: string = "EMAIL_ALREADY_IN_USE";
  readonly statusCode: number = 409;

  constructor() {
    super("The email is already in use");
  }
}