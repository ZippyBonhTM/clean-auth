import AccessTokenExpiredError from '@/application/protocols/errors/AccessTokenExpiredError.js';
import RefreshTokenExpiredError from '@/application/protocols/errors/RefreshTokenExpiredError.js';
import type TokenService from '@/application/protocols/TokenService.js';
import jwt from 'jsonwebtoken';

type EnvInput = Record<string, string | undefined>;

function readRequiredSecret(input: EnvInput, key: keyof EnvInput): string {
  const value = input[key]?.trim();

  if (value === undefined || value.length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export default class JwtService implements TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(input: EnvInput = process.env) {
    this.accessSecret = readRequiredSecret(input, 'JWT_ACCESS_SECRET');
    this.refreshSecret = readRequiredSecret(input, 'JWT_REFRESH_SECRET');
  }

  generateAccessToken(payload: object) {
    return jwt.sign(payload, this.accessSecret, { expiresIn: "15m" });
  }

  generateRefreshToken(payload: object) {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.accessSecret);
      if (typeof decoded !== 'object') return null;
      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AccessTokenExpiredError();
      }
      return null;
    }
  }

  verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);
      if (typeof decoded !== 'object') return null;
      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new RefreshTokenExpiredError();
      }
      return null;
    }
  }
}

export { readRequiredSecret };
