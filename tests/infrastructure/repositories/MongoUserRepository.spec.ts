import { afterEach, describe, expect, it, vi } from 'vitest';

import UserModel from '@/infrastructure/mongoose/models/UserModel.js';
import MongoUserRepository from '@/infrastructure/repositories/MongoUserRepository.js';

describe('MongoUserRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses a valid inclusion projection when listing identities', async () => {
    const exec = vi.fn().mockResolvedValue([
      { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' },
      { id: 'user-2', name: 'Marie Curie', email: 'marie@example.com' },
      { id: 'user-3', name: 'Rosalind Franklin', email: 'rosalind@example.com' },
    ]);
    const lean = vi.fn().mockReturnValue({ exec });
    const limit = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ limit });
    const find = vi.spyOn(UserModel, 'find').mockReturnValue({ sort } as never);

    const repository = new MongoUserRepository();
    const result = await repository.listIdentities({ cursor: null, limit: 2 });

    expect(find).toHaveBeenCalledWith({}, { _id: 0, id: 1, name: 1, email: 1 });
    expect(sort).toHaveBeenCalledWith({ id: 1 });
    expect(limit).toHaveBeenCalledWith(3);
    expect(result).toEqual({
      items: [
        { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' },
        { id: 'user-2', name: 'Marie Curie', email: 'marie@example.com' },
      ],
      nextCursor: 'user-2',
    });
  });

  it('applies the cursor filter when listing identities', async () => {
    const exec = vi.fn().mockResolvedValue([]);
    const lean = vi.fn().mockReturnValue({ exec });
    const limit = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ limit });
    const find = vi.spyOn(UserModel, 'find').mockReturnValue({ sort } as never);

    const repository = new MongoUserRepository();
    await repository.listIdentities({ cursor: 'user-9', limit: 25 });

    expect(find).toHaveBeenCalledWith({ id: { $gt: 'user-9' } }, { _id: 0, id: 1, name: 1, email: 1 });
  });

  it('accepts the immediately previous token version within the configured refresh grace window', async () => {
    const findOneAndUpdate = vi.spyOn(UserModel, 'findOneAndUpdate').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue(null),
        }),
      }),
    } as never);
    const findOne = vi.spyOn(UserModel, 'findOne').mockReturnValue({
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          id: 'user-1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          passwordHash: 'hashed',
          role: 'USER',
          tokenVersion: 8,
          lastRefreshRotatedAt: new Date(),
        }),
      }),
    } as never);

    const repository = new MongoUserRepository(3_000);
    const result = await repository.refreshSession('user-1', 7);

    expect(findOneAndUpdate).toHaveBeenCalled();
    expect(findOne).toHaveBeenCalledWith({ id: 'user-1' }, { _id: 0, __v: 0 });
    expect(result).toMatchObject({
      resolution: 'grace',
      user: {
        id: 'user-1',
      },
    });
  });
});
