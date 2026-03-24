import type UserRepository from "@/application/protocols/UserRepository.js";
import type { ListUserIdentitiesInput } from "@/application/protocols/UserRepository.js";
import type { RefreshSessionResult } from "@/application/protocols/UserRepository.js";
import User from "@/domain/User.js";
import { resolveRefreshRotationGraceMs } from "@/infrastructure/repositories/refreshRotationGrace.js";

export default class LocalUserRepository implements UserRepository {
  private userList: User[] = [];
  private lastRefreshRotationMs = new Map<string, number>();
  private readonly refreshRotationGraceMs: number;

  constructor(refreshRotationGraceMs: number = resolveRefreshRotationGraceMs()) {
    this.refreshRotationGraceMs = refreshRotationGraceMs;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.userList.find((user) => {
      return user.email === email;
    });
    if (!user) return null;
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.userList.find((user) => { return user.id === id; });
    if (!user) return null;
    return user;
  }

  async listIdentities(input: ListUserIdentitiesInput) {
    const cursor = input.cursor?.trim() ?? "";
    const visibleUsers = this.userList
      .slice()
      .sort((first, second) => first.id.localeCompare(second.id))
      .filter((user) => cursor.length === 0 || user.id.localeCompare(cursor) > 0);
    const pageItems = visibleUsers.slice(0, input.limit);
    const lastItem = pageItems[pageItems.length - 1];

    return {
      items: pageItems.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),
      nextCursor: visibleUsers.length > input.limit && lastItem !== undefined ? lastItem.id : null,
    };
  }

  async refreshSession(id: string, currentTokenVersion: number): Promise<RefreshSessionResult | null> {
    const userIndex = this.userList.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    const user = this.userList[userIndex];

    if (user === undefined) {
      return null;
    }

    const currentVersion = user.getTokenVersion();

    if (currentVersion === currentTokenVersion) {
      user.rotateRefreshToken();
      this.userList[userIndex] = user;
      this.lastRefreshRotationMs.set(user.id, Date.now());

      return {
        user,
        resolution: 'rotated',
      };
    }

    const rotatedAtMs = this.lastRefreshRotationMs.get(user.id) ?? null;
    const isWithinGraceWindow =
      rotatedAtMs !== null && Date.now() - rotatedAtMs <= this.refreshRotationGraceMs;

    if (currentVersion === currentTokenVersion + 1 && isWithinGraceWindow) {
      return {
        user,
        resolution: 'grace',
      };
    }

    return null;
  }

  async rotateRefreshToken(id: string, currentTokenVersion: number): Promise<User | null> {
    const userIndex = this.userList.findIndex((user) => {
      return user.id === id && user.getTokenVersion() === currentTokenVersion;
    });

    if (userIndex === -1) {
      return null;
    }

    const user = this.userList[userIndex];

    if (user === undefined) {
      return null;
    }

    user.rotateRefreshToken();
    this.userList[userIndex] = user;
    this.lastRefreshRotationMs.delete(user.id);

    return user;
  }

  async revokeUserSessions(id: string): Promise<boolean> {
    const userIndex = this.userList.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return false;
    }

    const user = this.userList[userIndex];

    if (user === undefined) {
      return false;
    }

    user.rotateRefreshToken();
    this.userList[userIndex] = user;
    this.lastRefreshRotationMs.delete(user.id);

    return true;
  }

  async save(user: User): Promise<void> {
    const index = this.userList.findIndex((item) => item.id === user.id);

    if (index === -1) {
      this.userList.push(user);
      return;
    }

    this.userList[index] = user;
  }
}
