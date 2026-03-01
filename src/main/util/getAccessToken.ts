import type { Request } from 'express';
import MissingAuthorizationError from '../errors/MissingAuthorizationError.js';

export default function getAccessToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new MissingAuthorizationError();

  const [, accessToken] = authHeader.split(' ');
  if (!accessToken) throw new MissingAuthorizationError();
  return accessToken;
}