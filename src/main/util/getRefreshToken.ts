import type { Request } from 'express';
import MissingAuthorizationError from '../errors/MissingAuthorizationError.js';

export default function getRefreshToken(req: Request): string {
  const refreshToken = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('refreshToken='))
    ?.replace('refreshToken=', '');
  if (!refreshToken) throw new MissingAuthorizationError();
  return refreshToken;
}