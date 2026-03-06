import AccessTokenExpiredError from '../protocols/errors/AccessTokenExpiredError.js';
import type TokenService from '../protocols/TokenService.js';
import type UserRepository from '../protocols/UserRepository.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

export interface ResolvedAuthSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
}

export default class ResolveAuthSessionUseCase {
  constructor(
    private tokenService: TokenService,
    private userRepo: UserRepository
  ) {}

  async execute(accessToken: string, refreshToken: string): Promise<ResolvedAuthSession> {
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
      const tokenVersion = resolveRefreshTokenVersion(refreshPayload.tokenVersion);

      if (tokenVersion === null) {
        throw new InvalidTokenError();
      }

      const user = await this.userRepo.rotateRefreshToken(refreshPayload.id, tokenVersion);

      if (user === null) {
        throw new InvalidTokenError();
      }

      const newAccessToken = this.tokenService.generateAccessToken({ id: refreshPayload.id });
      const newRefreshToken = this.tokenService.generateRefreshToken({
        id: refreshPayload.id,
        tokenVersion: user.getTokenVersion(),
      });

      return {
        userId: refreshPayload.id,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    }
  }
}

function resolveRefreshTokenVersion(value: unknown): number | null {
  if (value === undefined) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}
