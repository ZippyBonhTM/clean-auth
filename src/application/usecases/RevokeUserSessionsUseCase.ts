import type UserRepository from '@/application/protocols/UserRepository.js';

type RevokeUserSessionsResponse = {
  revokedSessionCount: number;
};

export default class RevokeUserSessionsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<RevokeUserSessionsResponse> {
    const normalizedUserId = userId.trim();

    if (normalizedUserId.length === 0) {
      return {
        revokedSessionCount: 0,
      };
    }

    const revoked = await this.userRepository.revokeUserSessions(normalizedUserId);

    return {
      revokedSessionCount: revoked ? 1 : 0,
    };
  }
}

export type { RevokeUserSessionsResponse };
