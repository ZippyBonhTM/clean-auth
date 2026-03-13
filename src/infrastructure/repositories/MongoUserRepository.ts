import type UserRepository from '@/application/protocols/UserRepository.js';
import User from '@/domain/User.js';
import UserModel from '@/infrastructure/mongoose/models/UserModel.js';
import type { UserDocument } from '@/infrastructure/mongoose/models/UserModel.js';

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

  async rotateRefreshToken(id: string, currentTokenVersion: number): Promise<User | null> {
    const user = await UserModel.findOneAndUpdate(
      { id, tokenVersion: currentTokenVersion },
      {
        $inc: {
          tokenVersion: 1,
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
