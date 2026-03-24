import { describe, expect, it, vi } from 'vitest';

import AccessTokenExpiredError from '@/application/protocols/errors/AccessTokenExpiredError.js';
import type TokenService from '@/application/protocols/TokenService.js';
import ResolveAuthSessionUseCase from '@/application/usecases/ResolveAuthSessionUseCase.js';

function makeTokenService(): TokenService {
  return {
    generateAccessToken: vi.fn().mockReturnValue('renewed-access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('renewed-refresh-token'),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };
}

describe('ResolveAuthSessionUseCase', () => {
  it('keeps the current access token when it is still valid', async () => {
    const tokenService = makeTokenService();

    vi.mocked(tokenService.verifyAccessToken).mockReturnValue({ id: 'user-1' });

    const sut = new ResolveAuthSessionUseCase(tokenService);

    await expect(sut.execute('access-token')).resolves.toEqual({
      userId: 'user-1',
      accessToken: 'access-token',
    });
  });

  it('throws when the access token expired instead of rotating through the profile path', async () => {
    const tokenService = makeTokenService();

    vi.mocked(tokenService.verifyAccessToken).mockImplementation(() => {
      throw new AccessTokenExpiredError();
    });

    const sut = new ResolveAuthSessionUseCase(tokenService);

    await expect(sut.execute('expired-access-token')).rejects.toBeInstanceOf(AccessTokenExpiredError);
    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(tokenService.generateRefreshToken).not.toHaveBeenCalled();
  });
});
