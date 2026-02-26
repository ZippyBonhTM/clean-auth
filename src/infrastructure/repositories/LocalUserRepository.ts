import type UserRepository from "@/application/protocols/UserRepository.js";
import User from "@/domain/User.js";

export default class LocalUserRepository implements UserRepository {
  private userList: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.userList.find((user) => { return user.email == email; });
    if (!user) return null;
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.userList.find((user) => { return user.id === id; });
    if (!user) return null;
    return user;
  }

  async save(user: User): Promise<void> {
    this.userList.push(user);
  }
}
