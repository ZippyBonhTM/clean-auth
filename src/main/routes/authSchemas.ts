import z from 'zod';

const emailSchema = z.string().trim().email();

const passwordSchema = z.string().min(1).refine((value) => {
  return value.trim().length > 0;
}, 'Password is required.');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export { loginSchema, registerSchema };
