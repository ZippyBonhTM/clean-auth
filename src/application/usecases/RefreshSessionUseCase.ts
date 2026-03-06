import type { LoginResponseDTO } from '../dtos/LoginDTO.js';
import type TokenService from '../protocols/TokenService.js';
import type UserRepository from '../protocols/UserRepository.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

export default class RefreshSessionUseCase {
  constructor(
    private tokenService: TokenService,
    private userRepo: UserRepository,
  ) {}

  async execute(refreshToken: string): Promise<LoginResponseDTO> {
    const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);

    if (!refreshPayload || typeof refreshPayload.id !== 'string') {
      throw new InvalidTokenError();
    }

    const tokenVersion = resolveRefreshTokenVersion(refreshPayload.tokenVersion);

    if (tokenVersion === null) {
      throw new InvalidTokenError();
    }

    const user = await this.userRepo.rotateRefreshToken(refreshPayload.id, tokenVersion);

    if (user === null) {
      throw new InvalidTokenError();
    }

    return {
      accessToken: this.tokenService.generateAccessToken({ id: user.id }),
      refreshToken: this.tokenService.generateRefreshToken({
        id: user.id,
        tokenVersion: user.getTokenVersion(),
      }),
    };
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
