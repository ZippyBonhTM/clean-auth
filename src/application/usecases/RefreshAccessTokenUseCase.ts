import type TokenService from '../protocols/TokenService.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

type RefreshAccessTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export default class RefreshAccessTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(refreshToken: string): RefreshAccessTokenResponse {
    const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);

    if (!refreshPayload || typeof refreshPayload.id !== 'string') {
      throw new InvalidTokenError();
    }

    return {
      accessToken: this.tokenService.generateAccessToken({ id: refreshPayload.id }),
      refreshToken: this.tokenService.generateRefreshToken({ id: refreshPayload.id }),
    };
  }
}
