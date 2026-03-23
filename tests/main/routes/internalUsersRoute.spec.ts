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

describe('internal users route', () => {
  it('lists auth users through internal service authorization in bounded pages', async () => {
    const registrations = [
      {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
      {
        name: 'Marie Curie',
        email: 'marie@example.com',
      },
      {
        name: 'Rosalind Franklin',
        email: 'rosalind@example.com',
      },
    ];

    for (const registration of registrations) {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          ...registration,
          password: 'safe-password',
        }),
      });

      expect(response.status).toBe(201);
    }

    const firstPageResponse = await fetch(`${baseUrl}/internal/users?limit=2`, {
      headers: {
        authorization: 'Bearer internal-service-secret',
      },
    });

    expect(firstPageResponse.status).toBe(200);
    const firstPagePayload = (await firstPageResponse.json()) as {
      items: Array<{ id: string; name: string; email: string }>;
      nextCursor: string | null;
    };

    expect(firstPagePayload.items).toHaveLength(2);
    expect(firstPagePayload.items[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
    });
    expect(firstPagePayload.nextCursor).toEqual(firstPagePayload.items[1]?.id ?? null);

    const secondPageResponse = await fetch(
      `${baseUrl}/internal/users?limit=2&cursor=${encodeURIComponent(firstPagePayload.nextCursor ?? '')}`,
      {
        headers: {
          authorization: 'Bearer internal-service-secret',
        },
      },
    );

    expect(secondPageResponse.status).toBe(200);
    const secondPagePayload = (await secondPageResponse.json()) as {
      items: Array<{ id: string; name: string; email: string }>;
      nextCursor: string | null;
    };

    expect(secondPagePayload.items).toHaveLength(1);
    expect(secondPagePayload.items[0]?.id).not.toBe(firstPagePayload.items[0]?.id);
    expect(secondPagePayload.nextCursor).toBeNull();
  });

  it('rejects directory listing without the configured internal service token', async () => {
    const response = await fetch(`${baseUrl}/internal/users`, {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    expect(response.status).toBe(401);
  });
});
