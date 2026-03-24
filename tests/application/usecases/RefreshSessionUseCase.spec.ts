import { describe, expect, it, vi } from 'vitest';

import type TokenService from '@/application/protocols/TokenService.js';
import type UserRepository from '@/application/protocols/UserRepository.js';
import RefreshSessionUseCase from '@/application/usecases/RefreshSessionUseCase.js';
import { InvalidTokenError } from '@/application/usecases/errors/InvalidTokenError.js';
import User from '@/domain/User.js';

function makeTokenService(): TokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('next-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('next-refresh-token'),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
}

function makeRepository(): UserRepository {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    refreshSession: vi.fn(),
    rotateRefreshToken: vi.fn(),
    save: vi.fn(),
    revokeUserSessions: vi.fn(),
    listIdentities: vi.fn(),
  };
}

describe('RefreshSessionUseCase', () => {
  it('rotates the refresh token atomically through the repository', async () => {
    const tokenService = makeTokenService();
    const userRepository = makeRepository();
    const rotatedUser = User.createWithDetails(
      'user-1',
      'Ada Lovelace',
      'ada@example.com',
      'hashed-password',
      'USER',
      4,
    );

    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      id: 'user-1',
      tokenVersion: 3,
    });
    vi.mocked(userRepository.refreshSession).mockResolvedValue({
      user: rotatedUser,
      resolution: 'rotated',
    });

    const sut = new RefreshSessionUseCase(tokenService, userRepository);

    const output = await sut.execute('refresh-token');

    expect(userRepository.refreshSession).toHaveBeenCalledWith('user-1', 3);
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({ id: 'user-1' });
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
      id: 'user-1',
      tokenVersion: 4,
    });
    expect(output).toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });
  });

  it('throws when the repository cannot rotate the token for the informed version', async () => {
    const tokenService = makeTokenService();
    const userRepository = makeRepository();

    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      id: 'user-1',
      tokenVersion: 3,
    });
    vi.mocked(userRepository.refreshSession).mockResolvedValue(null);

    const sut = new RefreshSessionUseCase(tokenService, userRepository);

    await expect(sut.execute('refresh-token')).rejects.toBeInstanceOf(InvalidTokenError);
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(tokenService.generateRefreshToken).not.toHaveBeenCalled();
  });
});
