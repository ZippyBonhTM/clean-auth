import { v4 } from 'uuid';

export default class User {
  private constructor(
    public id: string,
    public name: string,
    public email: string,
    private passwordHash: string,
    public role: "USER" | "ADMIN",
    private tokenVersion: number
  ) { }

  changePassword(newHash: string): void {
    this.passwordHash = newHash;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getTokenVersion(): number {
    return this.tokenVersion;
  }

  rotateRefreshToken(): number {
    this.tokenVersion += 1;
    return this.tokenVersion;
  }

  static create(name: string, email: string, passwordHash: string): User {
    return new User(
      v4(),
      name,
      email,
      passwordHash,
      "USER",
      0,
    );
  }

  static createWithDetails(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    role: "USER" | "ADMIN",
    tokenVersion: number = 0,
  ): User {
    return new User(id, name, email, passwordHash, role, tokenVersion);
  }
}
