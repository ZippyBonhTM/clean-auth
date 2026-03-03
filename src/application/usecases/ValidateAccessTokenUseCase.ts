import type TokenService from '@/application/protocols/TokenService.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

type ValidateAccessTokenResponse = {
  userId: string;
};

export default class ValidateAccessTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(accessToken: string): ValidateAccessTokenResponse {
    const payload = this.tokenService.verifyAccessToken(accessToken);

    if (!payload || typeof payload.id !== 'string') {
      throw new InvalidTokenError();
    }

    return {
      userId: payload.id,
    };
  }
}

export type { ValidateAccessTokenResponse };
