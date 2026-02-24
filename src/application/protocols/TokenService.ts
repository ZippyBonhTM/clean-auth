export default interface TokenService {
  generateAccessToken(payload: object): string;
  generateRefreshToken(payload: object): string;
  verify(token: string): any;
}