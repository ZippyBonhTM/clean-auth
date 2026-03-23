import User from "@/domain/User.js";

export type UserIdentitySummary = {
  id: string;
  name: string;
  email: string;
};

export type ListUserIdentitiesInput = {
  cursor?: string | null;
  limit: number;
};

export type ListUserIdentitiesResult = {
  items: UserIdentitySummary[];
  nextCursor: string | null;
};

export default interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  listIdentities(input: ListUserIdentitiesInput): Promise<ListUserIdentitiesResult>;
  rotateRefreshToken(id: string, currentTokenVersion: number): Promise<User | null>;
  revokeUserSessions(id: string): Promise<boolean>;
  save(user: User): Promise<void>;
}
