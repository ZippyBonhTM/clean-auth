import { v4 } from 'uuid';

export default class User {
  private constructor(
    public id: string,
    public name: string,
    public email: string,
    private passwordHash: string,
    public role: "USER" | "ADMIN"
  ) { }

  changePassword(newHash: string): void {
    this.passwordHash = newHash;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  static create(name: string, email: string, passwordHash: string): User {
    return new User(
      v4(),
      name,
      email,
      passwordHash,
      "USER"
    );
  }

  static createWithDetails(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    role: "USER" | "ADMIN"
  ): User {
    return new User(id, name, email, passwordHash, role);
  }
}