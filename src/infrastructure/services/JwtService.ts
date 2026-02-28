import type TokenService from "@/application/protocols/TokenService.js";
import jwt from "jsonwebtoken";

export default class JwtService implements TokenService {
  generateAccessToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
  }

  generateRefreshToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    if (typeof decoded !== 'object') return null;
    return decoded;
  }
  
  verifyRefreshToken(token: string) {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN!);
    if (typeof decoded !== 'object') return null;
    return decoded;
  }
}
