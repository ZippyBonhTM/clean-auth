import express from 'express';
import {
  loginUseCase,
  logoutSessionUseCase,
  refreshSessionUseCase,
  registerUseCase,
  showProfileUseCase,
  validateAccessTokenUseCase
} from '../factory/login.js';
import getAccessToken from '../util/getAccessToken.js';
import getRefreshToken from '../util/getRefreshToken.js';
import { loginSchema, registerSchema } from './authSchemas.js';
import setRefreshTokenCookie, { clearRefreshTokenCookie } from '../util/setRefreshTokenCookie.js';

const router = express.Router();

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
    const refreshToken = readOptionalRefreshToken(req);

    const profileResponse = await showProfileUseCase.execute(accessToken, refreshToken);

    if (!profileResponse) {
      res.status(404).json({ message: "Usuário não encontrado" });
      return;
    }

    if (profileResponse.refreshToken) {
      setRefreshTokenCookie(res, profileResponse.refreshToken);
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

export default router;
