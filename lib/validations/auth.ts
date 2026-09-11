import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required')
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username must be under 50 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be under 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
