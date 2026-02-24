import bcrypt from "bcrypt";
import type HashService from '@/application/protocols/HashService.js';

export default class BcryptHashService implements HashService {
  async hash(value: string): Promise<string> {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(value, saltRounds);

    return hashed;
  }

  async compare(value: string, hash: string): Promise<boolean> {
    const isValid = await bcrypt.compare(value, hash);

    return isValid;
  }
}