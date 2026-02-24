import type TokenService from "@/application/protocols/TokenService.js";
import jwt from "jsonwebtoken";

export default class JwtService implements TokenService {
  generateAccessToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" })
  }

  generateRefreshToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" })
  }

  verify(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!)
  }
}
