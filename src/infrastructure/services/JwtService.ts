import AccessTokenExpiredError from '@/application/protocols/errors/AccessTokenExpiredError.js';
import RefreshTokenExpiredError from '@/application/protocols/errors/RefreshTokenExpiredError.js';
import type TokenService from '@/application/protocols/TokenService.js';
import jwt from 'jsonwebtoken';

export default class JwtService implements TokenService {
  generateAccessToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
  }

  generateRefreshToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
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
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
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
