import type UserRepository from '@/application/protocols/UserRepository.js';
import type { ListUserIdentitiesInput } from '@/application/protocols/UserRepository.js';
import type { RefreshSessionResult } from '@/application/protocols/UserRepository.js';
import User from '@/domain/User.js';
import UserModel from '@/infrastructure/mongoose/models/UserModel.js';
import type { UserDocument } from '@/infrastructure/mongoose/models/UserModel.js';
import { resolveRefreshRotationGraceMs } from '@/infrastructure/repositories/refreshRotationGrace.js';

function toDomain(document: UserDocument): User {
  return User.createWithDetails(
    document.id,
    document.name,
    document.email,
    document.passwordHash,
    document.role,
    document.tokenVersion ?? 0,
  );
}

export default class MongoUserRepository implements UserRepository {
  private readonly refreshRotationGraceMs: number;

  constructor(refreshRotationGraceMs: number = resolveRefreshRotationGraceMs()) {
    this.refreshRotationGraceMs = refreshRotationGraceMs;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }, { _id: 0, __v: 0 }).lean().exec();

    if (user === null) {
      return null;
    }

    return toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findOne({ id }, { _id: 0, __v: 0 }).lean().exec();

    if (user === null) {
      return null;
    }

    return toDomain(user);
  }

  async listIdentities(input: ListUserIdentitiesInput) {
    const cursor = input.cursor?.trim() ?? '';
    const query =
      cursor.length > 0
        ? { id: { $gt: cursor } }
        : {};
    const documents = await UserModel.find(query, { _id: 0, id: 1, name: 1, email: 1 })
      .sort({ id: 1 })
      .limit(input.limit + 1)
      .lean<Array<Pick<UserDocument, 'id' | 'name' | 'email'>>>()
      .exec();
    const hasNextPage = documents.length > input.limit;
    const pageItems = hasNextPage ? documents.slice(0, input.limit) : documents;
    const lastItem = pageItems[pageItems.length - 1];

    return {
      items: pageItems.map((document) => ({
        id: document.id,
        name: document.name,
        email: document.email,
      })),
      nextCursor: hasNextPage && lastItem !== undefined ? lastItem.id : null,
    };
  }

  async rotateRefreshToken(id: string, currentTokenVersion: number): Promise<User | null> {
    const user = await UserModel.findOneAndUpdate(
      { id, tokenVersion: currentTokenVersion },
      {
        $inc: {
          tokenVersion: 1,
        },
        $set: {
          lastRefreshRotatedAt: null,
        },
      },
      { new: true },
    )
      .select({ _id: 0, __v: 0 })
      .lean<UserDocument>()
      .exec();

    if (user === null) {
      return null;
    }

    return toDomain(user);
  }

  async refreshSession(id: string, currentTokenVersion: number): Promise<RefreshSessionResult | null> {
    const rotatedAt = new Date();
    const rotatedUser = await UserModel.findOneAndUpdate(
      { id, tokenVersion: currentTokenVersion },
      {
        $inc: {
          tokenVersion: 1,
        },
        $set: {
          lastRefreshRotatedAt: rotatedAt,
        },
      },
      { new: true },
    )
      .select({ _id: 0, __v: 0 })
      .lean<UserDocument>()
      .exec();

    if (rotatedUser !== null) {
      return {
        user: toDomain(rotatedUser),
        resolution: 'rotated',
      };
    }

    const currentUser = await UserModel.findOne({ id }, { _id: 0, __v: 0 }).lean<UserDocument>().exec();

    if (currentUser === null) {
      return null;
    }

    const rotatedAtMs = currentUser.lastRefreshRotatedAt?.getTime() ?? null;
    const isWithinGraceWindow =
      rotatedAtMs !== null && Date.now() - rotatedAtMs <= this.refreshRotationGraceMs;

    if (currentUser.tokenVersion === currentTokenVersion + 1 && isWithinGraceWindow) {
      return {
        user: toDomain(currentUser),
        resolution: 'grace',
      };
    }

    return null;
  }

  async revokeUserSessions(id: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { id },
      {
        $inc: {
          tokenVersion: 1,
        },
        $set: {
          lastRefreshRotatedAt: null,
        },
      },
    ).exec();

    return result.matchedCount > 0;
  }

  async save(user: User): Promise<void> {
    await UserModel.updateOne(
      { id: user.id },
      {
        $set: {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: user.getPasswordHash(),
          role: user.role,
          tokenVersion: user.getTokenVersion(),
        },
      },
      { upsert: true },
    );
  }
}
