import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

type MutableEnv = Record<string, string | undefined>;

const originalEnv: MutableEnv = { ...process.env };

let server: Server | null = null;
let baseUrl = '';

beforeAll(async () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    DATA_SOURCE: 'memory',
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    REFRESH_ROTATION_GRACE_MS: '3000',
  };

  vi.resetModules();
  const { default: app } = await import('@/main/config/app.js');

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server?.address();

      if (address === null || typeof address !== 'object') {
        throw new Error('Could not resolve auth test server address.');
      }

      baseUrl = `http://127.0.0.1:${String(address.port)}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  server = null;
  baseUrl = '';
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe('refresh route', () => {
  it('accepts a concurrent retry with the immediately previous refresh token within the grace window', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'safe-password',
      }),
    });
    const refreshCookie = registerResponse.headers.get('set-cookie');

    expect(registerResponse.status).toBe(201);
    expect(refreshCookie).not.toBeNull();

    const firstRefreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(firstRefreshResponse.status).toBe(200);

    const secondRefreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(secondRefreshResponse.status).toBe(200);
    await expect(secondRefreshResponse.json()).resolves.toMatchObject({
      accessToken: expect.any(String),
      message: 'Token refreshed',
    });
  });

  it('keeps logout strict so the old refresh token cannot be reused right after logout', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        password: 'safe-password',
      }),
    });
    const refreshCookie = registerResponse.headers.get('set-cookie');

    expect(registerResponse.status).toBe(201);
    expect(refreshCookie).not.toBeNull();

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(refreshResponse.status).toBe(401);
  });

  it('does not clear the refresh cookie for a generic invalid refresh token error', async () => {
    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: 'refreshToken=not-a-valid-token',
      },
    });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.headers.get('set-cookie')).toBeNull();
    await expect(refreshResponse.json()).resolves.toMatchObject({
      code: 'INVALID_TOKEN_ERROR',
    });
  });

  it('still clears the refresh cookie when the refresh token is truly expired', async () => {
    const expiredRefreshToken = jwt.sign(
      {
        id: 'user-1',
        tokenVersion: 0,
      },
      process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret',
      { expiresIn: -1 },
    );

    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: `refreshToken=${expiredRefreshToken}`,
      },
    });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.headers.get('set-cookie')).toContain('refreshToken=');
    await expect(refreshResponse.json()).resolves.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
    });
  });
});
