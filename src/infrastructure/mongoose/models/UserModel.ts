import mongoose from 'mongoose';

type UserRole = 'USER' | 'ADMIN';

type UserDocument = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  tokenVersion: number;
};

const userSchema = new mongoose.Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN'], required: true },
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  {
    collection: 'users',
    strict: true,
  }
);

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;
export type { UserDocument, UserRole };
