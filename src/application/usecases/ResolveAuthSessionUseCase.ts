import type TokenService from '../protocols/TokenService.js';
import { InvalidTokenError } from './errors/InvalidTokenError.js';

export interface ResolvedAuthSession {
  userId: string;
  accessToken: string;
}

export default class ResolveAuthSessionUseCase {
  constructor(
    private tokenService: TokenService,
  ) {}

  async execute(accessToken: string): Promise<ResolvedAuthSession> {
    const accessPayload = this.tokenService.verifyAccessToken(accessToken);

    if (!accessPayload || typeof accessPayload.id !== 'string') {
      throw new InvalidTokenError();
    }

    return {
      userId: accessPayload.id,
      accessToken,
    };
  }
}
