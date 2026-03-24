import express from 'express';
import {
  listInternalUsersUseCase,
  loginUseCase,
  logoutSessionUseCase,
  refreshSessionUseCase,
  revokeUserSessionsUseCase,
  registerUseCase,
  showProfileUseCase,
  validateAccessTokenUseCase
} from '../factory/login.js';
import getAccessToken from '../util/getAccessToken.js';
import getRefreshToken from '../util/getRefreshToken.js';
import { loginSchema, registerSchema, revokeUserSessionsSchema } from './authSchemas.js';
import setRefreshTokenCookie, { clearRefreshTokenCookie } from '../util/setRefreshTokenCookie.js';
import { isInternalServiceAuthorized, readConfiguredInternalServiceToken } from '../util/isInternalServiceAuthorized.js';

const router = express.Router();
const INTERNAL_USERS_DEFAULT_LIMIT = 25;
const INTERNAL_USERS_MAX_LIMIT = 100;

function readOptionalRefreshToken(req: express.Request): string {
  const cookieHeader = req.headers.cookie;

  if (cookieHeader === undefined || cookieHeader.trim().length === 0) {
    return '';
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('refreshToken='))
    ?.replace('refreshToken=', '') ?? '';
}

function parseInternalUsersLimit(req: express.Request): number | null {
  const rawValue = typeof req.query.limit === 'string' ? req.query.limit.trim() : '';

  if (rawValue.length === 0) {
    return INTERNAL_USERS_DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return Math.min(parsed, INTERNAL_USERS_MAX_LIMIT);
}

function parseInternalUsersCursor(req: express.Request): string | null {
  const rawValue = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : '';
  return rawValue.length > 0 ? rawValue : null;
}

router.post('/login', async (req, res, next) => {
  try {
    const data = await loginSchema.parseAsync(req.body);
    const loginResponse = await loginUseCase.execute({ email: data.email, password: data.password });

    setRefreshTokenCookie(res, loginResponse.refreshToken);

    res
      .status(200)
      .json({ accessToken: loginResponse.accessToken, message: "user logged" });
    return;
  } catch (err) {
    next(err);
  }
});


router.post('/register', async (req, res, next) => {
  try {
    const data = await registerSchema.parseAsync(req.body);
    const { accessToken, refreshToken } = await registerUseCase.execute(data);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201)
      .json({ accessToken, message: 'User created' });

    return;
  } catch (err) {
    next(err);
  }
});

router.get('/validate-token', async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    const validationResponse = validateAccessTokenUseCase.execute(accessToken);

    res.status(200).json({
      valid: true,
      userId: validationResponse.userId,
      message: 'Token is valid'
    });
    return;
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = getRefreshToken(req);
    const refreshResponse = await refreshSessionUseCase.execute(refreshToken);

    setRefreshTokenCookie(res, refreshResponse.refreshToken);

    res.status(200).json({
      accessToken: refreshResponse.accessToken,
      message: 'Token refreshed'
    });
    return;
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = readOptionalRefreshToken(req);

    if (refreshToken.length > 0) {
      await logoutSessionUseCase.execute(refreshToken);
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({ message: 'User logged out' });
    return;
  } catch (err) {
    next(err);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    const profileResponse = await showProfileUseCase.execute(accessToken);

    if (!profileResponse) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    res.status(200).json({
      userProfile: profileResponse.userProfile,
      accessToken: profileResponse.accessToken,
      message: "Usuário encontrado"
    });
    return;
  } catch (err) {
    next(err);
  }
});

router.get('/internal/users', async (req, res, next) => {
  try {
    const configuredToken = readConfiguredInternalServiceToken();

    if (configuredToken === null) {
      res.status(503).json({ message: 'Internal service authorization is not configured.' });
      return;
    }

    const providedToken = getAccessToken(req);

    if (!isInternalServiceAuthorized(providedToken)) {
      res.status(401).json({ message: 'Invalid internal service authorization.' });
      return;
    }

    const limit = parseInternalUsersLimit(req);

    if (limit === null) {
      res.status(400).json({ message: 'limit must be a positive integer.' });
      return;
    }

    const response = await listInternalUsersUseCase.execute({
      cursor: parseInternalUsersCursor(req),
      limit,
    });

    res.status(200).json({
      items: response.items,
      nextCursor: response.nextCursor,
      message: 'Internal users listed.',
    });
    return;
  } catch (err) {
    next(err);
  }
});

router.post('/internal/users/:userId/sessions/revoke', async (req, res, next) => {
  try {
    const configuredToken = readConfiguredInternalServiceToken();

    if (configuredToken === null) {
      res.status(503).json({ message: 'Internal service authorization is not configured.' });
      return;
    }

    const providedToken = getAccessToken(req);

    if (!isInternalServiceAuthorized(providedToken)) {
      res.status(401).json({ message: 'Invalid internal service authorization.' });
      return;
    }

    const userId = req.params.userId?.trim() ?? '';

    if (userId.length === 0) {
      res.status(400).json({ message: 'userId route param is required.' });
      return;
    }

    await revokeUserSessionsSchema.parseAsync(req.body);

    const revokeResponse = await revokeUserSessionsUseCase.execute(userId);

    if (revokeResponse.revokedSessionCount === 0) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      revokedSessionCount: revokeResponse.revokedSessionCount,
      message: 'User sessions revoked.',
    });
    return;
  } catch (err) {
    next(err);
  }
});

export default router;
