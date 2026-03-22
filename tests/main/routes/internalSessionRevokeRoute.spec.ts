import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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
    AUTH_INTERNAL_SERVICE_TOKEN: 'internal-service-secret',
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

describe('internal session revoke route', () => {
  it('invalidates refresh continuation for the target user through internal service auth', async () => {
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

    const profileResponse = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${registerPayload.accessToken}`,
        cookie: refreshCookie ?? '',
      },
    });
    const profilePayload = (await profileResponse.json()) as {
      userProfile: {
        id: string;
      };
    };

    expect(profileResponse.status).toBe(200);

    const revokeResponse = await fetch(
      `${baseUrl}/internal/users/${encodeURIComponent(profilePayload.userProfile.id)}/sessions/revoke`,
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer internal-service-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          actorUserId: 'admin-product-user-1',
          reason: 'Security rotation',
          mode: 'all',
        }),
      },
    );

    expect(revokeResponse.status).toBe(200);
    await expect(revokeResponse.json()).resolves.toMatchObject({
      revokedSessionCount: 1,
      message: 'User sessions revoked.',
    });

    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        cookie: refreshCookie ?? '',
      },
    });

    expect(refreshResponse.status).toBe(401);
  });

  it('rejects calls that do not present the configured internal service token', async () => {
    const response = await fetch(`${baseUrl}/internal/users/user-1/sessions/revoke`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        actorUserId: 'admin-product-user-1',
        reason: 'Security rotation',
      }),
    });

    expect(response.status).toBe(401);
  });
});
