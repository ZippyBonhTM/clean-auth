import { describe, expect, it } from 'vitest';

import JwtService from '@/infrastructure/services/JwtService.js';
describe('JwtService', () => {
  it('throws when access secret is missing', () => {
    expect(() => new JwtService({ JWT_ACCESS_SECRET: '', JWT_REFRESH_SECRET: 'refresh-secret' })).toThrow(
      'JWT_ACCESS_SECRET is required.',
    );
  });

  it('throws when refresh secret is missing', () => {
    expect(() => new JwtService({ JWT_ACCESS_SECRET: 'access-secret', JWT_REFRESH_SECRET: '' })).toThrow(
      'JWT_REFRESH_SECRET is required.',
    );
  });

  it('generates and validates an access token with configured secrets', () => {
    const sut = new JwtService({
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
    });

    const token = sut.generateAccessToken({ id: 'user-1' });

    expect(sut.verifyAccessToken(token)).toMatchObject({ id: 'user-1' });
  });
});
