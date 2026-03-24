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

describe('profile route', () => {
  it('does not rotate refresh tokens when the access token is expired', async () => {
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
    const registerPayload = (await registerResponse.json()) as {
      accessToken: string;
    };
    const refreshCookie = registerResponse.headers.get('set-cookie');

    expect(registerResponse.status).toBe(201);
    expect(refreshCookie).not.toBeNull();

    const decodedAccessToken = jwt.verify(
      registerPayload.accessToken,
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
    ) as { id?: string };

    expect(typeof decodedAccessToken.id).toBe('string');

    const expiredAccessToken = jwt.sign(
      { id: decodedAccessToken.id },
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
      { expiresIn: -1 },
    );

    const profileResponse = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${expiredAccessToken}`,
        cookie: refreshCookie ?? '',
      },
    });

    expect(profileResponse.status).toBe(401);
    await expect(profileResponse.json()).resolves.toMatchObject({
      code: 'ACCESS_TOKEN_EXPIRED',
    });

    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(refreshResponse.status).toBe(200);
    await expect(refreshResponse.json()).resolves.toMatchObject({
      accessToken: expect.any(String),
      message: 'Token refreshed',
    });
  });
});
