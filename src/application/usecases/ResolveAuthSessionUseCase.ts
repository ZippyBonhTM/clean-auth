import AccessTokenExpiredError from '../protocols/errors/AccessTokenExpiredError.js';
import type TokenService from '../protocols/TokenService.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

export interface ResolvedAuthSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
}

export default class ResolveAuthSessionUseCase {
  constructor(private tokenService: TokenService) {}

  execute(accessToken: string, refreshToken: string): ResolvedAuthSession {
    try {
      const accessPayload = this.tokenService.verifyAccessToken(accessToken);
      if (!accessPayload || typeof accessPayload.id !== 'string') throw new InvalidTokenError();

      return {
        userId: accessPayload.id,
        accessToken
      };
    } catch (err) {
      if (!(err instanceof AccessTokenExpiredError)) throw err;

      const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);
      if (!refreshPayload || typeof refreshPayload.id !== 'string') throw new InvalidTokenError();

      const newAccessToken = this.tokenService.generateAccessToken({ id: refreshPayload.id });
      const newRefreshToken = this.tokenService.generateRefreshToken({ id: refreshPayload.id });

      return {
        userId: refreshPayload.id,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    }
  }
}
