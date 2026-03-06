import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '@/main/routes/authSchemas.js';

describe('authSchemas', () => {
  it('rejects blank register fields', async () => {
    await expect(
      registerSchema.parseAsync({
        name: '   ',
        email: '  ada@example.com  ',
        password: '   ',
      }),
    ).rejects.toThrow();
  });

  it('normalizes trimmed register emails', async () => {
    await expect(
      registerSchema.parseAsync({
        name: 'Ada Lovelace',
        email: '  ada@example.com  ',
        password: 'safe password',
      }),
    ).resolves.toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'safe password',
    });
  });

  it('rejects blank login passwords', async () => {
    await expect(
      loginSchema.parseAsync({
        email: 'ada@example.com',
        password: '   ',
      }),
    ).rejects.toThrow();
  });
});
