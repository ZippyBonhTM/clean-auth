import express from 'express';
import z from 'zod';
import { loginUseCase, registerUseCase, showProfileUseCase } from '../factory/login.js';
import getAccessToken from '../util/getAccessToken.js';
import getRefreshToken from '../util/getRefreshToken.js';
import setRefreshTokenCookie from '../util/setRefreshTokenCookie.js';

const registerSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string()
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string()
});

const router = express.Router();

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

router.get('/profile', async (req, res, next) => {
  try {
    const accessToken = getAccessToken(req);
    const refreshToken = getRefreshToken(req);

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
