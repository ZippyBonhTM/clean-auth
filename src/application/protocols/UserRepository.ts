import User from "@/domain/User.js";

export default interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  rotateRefreshToken(id: string, currentTokenVersion: number): Promise<User | null>;
  revokeUserSessions(id: string): Promise<boolean>;
  save(user: User): Promise<void>;
}
