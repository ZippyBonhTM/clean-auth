import { describe, expect, it, vi } from 'vitest';

import type UserRepository from '@/application/protocols/UserRepository.js';
import RevokeUserSessionsUseCase from '@/application/usecases/RevokeUserSessionsUseCase.js';

function makeRepository(): UserRepository {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    rotateRefreshToken: vi.fn(),
    revokeUserSessions: vi.fn(),
    save: vi.fn(),
  };
}

describe('RevokeUserSessionsUseCase', () => {
  it('increments user session version through the repository', async () => {
    const userRepository = makeRepository();
    vi.mocked(userRepository.revokeUserSessions).mockResolvedValue(true);

    const sut = new RevokeUserSessionsUseCase(userRepository);

    await expect(sut.execute('user-1')).resolves.toEqual({
      revokedSessionCount: 1,
    });
    expect(userRepository.revokeUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('returns zero when the target user does not exist', async () => {
    const userRepository = makeRepository();
    vi.mocked(userRepository.revokeUserSessions).mockResolvedValue(false);

    const sut = new RevokeUserSessionsUseCase(userRepository);

    await expect(sut.execute('user-missing')).resolves.toEqual({
      revokedSessionCount: 0,
    });
  });
});
