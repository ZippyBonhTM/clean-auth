import express from 'express';
import z from 'zod';
import { loginUseCase, registerUseCase } from '../factory/login.js';

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
    const registerResponse = await registerUseCase.execute(data);

    res.cookie("token", registerResponse.accessToken, { httpOnly: true });
    res.cookie("refreshToken", registerResponse.refreshToken, { httpOnly: true });
    res.status(201).send("User created.");
  } catch (err) {
    next(err);
  }
});


export default router;