import type TokenService from '../protocols/TokenService.js';
import type UserRepository from '../protocols/UserRepository.js';

export default class LogoutSessionUseCase {
  constructor(
    private tokenService: TokenService,
    private userRepo: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);

      if (!refreshPayload || typeof refreshPayload.id !== 'string') {
        return;
      }

      const tokenVersion = resolveRefreshTokenVersion(refreshPayload.tokenVersion);

      if (tokenVersion === null) {
        return;
      }

      await this.userRepo.rotateRefreshToken(refreshPayload.id, tokenVersion);
    } catch {
      // Logout should still clear the cookie even if the current refresh token is stale.
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
