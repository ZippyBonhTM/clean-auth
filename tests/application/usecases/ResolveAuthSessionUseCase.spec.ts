import { describe, expect, it, vi } from 'vitest';

import AccessTokenExpiredError from '@/application/protocols/errors/AccessTokenExpiredError.js';
import type TokenService from '@/application/protocols/TokenService.js';
import type UserRepository from '@/application/protocols/UserRepository.js';
import ResolveAuthSessionUseCase from '@/application/usecases/ResolveAuthSessionUseCase.js';
import { InvalidTokenError } from '@/application/usecases/errors/InvalidTokenError.js';
import User from '@/domain/User.js';

function makeTokenService(): TokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('renewed-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('renewed-refresh-token'),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
}

function makeRepository(): UserRepository {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    rotateRefreshToken: vi.fn(),
    save: vi.fn(),
  };
}

describe('ResolveAuthSessionUseCase', () => {
  it('keeps the current access token when it is still valid', async () => {
    const tokenService = makeTokenService();
    const userRepository = makeRepository();

    vi.mocked(tokenService.verifyAccessToken).mockReturnValue({ id: 'user-1' });

    const sut = new ResolveAuthSessionUseCase(tokenService, userRepository);

    await expect(sut.execute('access-token', 'refresh-token')).resolves.toEqual({
      userId: 'user-1',
      accessToken: 'access-token',
    });
    expect(userRepository.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('renews the session with an atomic refresh-token rotation when the access token expired', async () => {
    const tokenService = makeTokenService();
    const userRepository = makeRepository();
    const rotatedUser = User.createWithDetails(
      'user-1',
      'Ada Lovelace',
      'ada@example.com',
      'hashed-password',
      'USER',
      5,
    );

    vi.mocked(tokenService.verifyAccessToken).mockImplementation(() => {
      throw new AccessTokenExpiredError();
    });
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      id: 'user-1',
      tokenVersion: 4,
    });
    vi.mocked(userRepository.rotateRefreshToken).mockResolvedValue(rotatedUser);

    const sut = new ResolveAuthSessionUseCase(tokenService, userRepository);

    await expect(sut.execute('expired-access-token', 'refresh-token')).resolves.toEqual({
      userId: 'user-1',
      accessToken: 'renewed-access-token',
      refreshToken: 'renewed-refresh-token',
    });
    expect(userRepository.rotateRefreshToken).toHaveBeenCalledWith('user-1', 4);
    expect(tokenService.generateRefreshToken).toHaveBeenCalledWith({
      id: 'user-1',
      tokenVersion: 5,
    });
  });

  it('throws invalid token when atomic rotation fails after an expired access token', async () => {
    const tokenService = makeTokenService();
    const userRepository = makeRepository();

    vi.mocked(tokenService.verifyAccessToken).mockImplementation(() => {
      throw new AccessTokenExpiredError();
    });
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      id: 'user-1',
      tokenVersion: 4,
    });
    vi.mocked(userRepository.rotateRefreshToken).mockResolvedValue(null);

    const sut = new ResolveAuthSessionUseCase(tokenService, userRepository);

    await expect(sut.execute('expired-access-token', 'refresh-token')).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });
});
