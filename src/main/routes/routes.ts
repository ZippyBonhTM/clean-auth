import express from 'express';
import z from 'zod';
import { loginUseCase, registerUseCase, showProfileUseCase } from '../factory/login.js';
import { error } from 'node:console';

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

    res.cookie("token", loginResponse.accessToken, { httpOnly: true });
    res.cookie("refreshToken", loginResponse.refreshToken, { httpOnly: true });
    res.status(200).send("User logged.");
  } catch (err) {
    next(err);
  }
});


router.post('/register', async (req, res, next) => {
  try {
    const data = await registerSchema.parseAsync(req.body);
    const { accessToken, refreshToken } = await registerUseCase.execute(data);

    res.status(201)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/refresh'
      })
      .json({ accessToken, message: 'User created' });

  } catch (err) {
    next(err);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Token não fornecido");

    const [, accessToken] = authHeader.split(' ');
    if (!accessToken) throw new Error("Token inválido");

    const userProfile = await showProfileUseCase.execute(accessToken);
    if (!userProfile) throw new Error('Token inválido');
    res.status(200).json({ userProfile, message: "Usuário encontrado" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

export default router;