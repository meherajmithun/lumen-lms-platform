import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your email'),
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z.object({
  username: z.string().min(2, 'Your name needs at least 2 characters').max(60),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  // Admin and Content Manager are assigned by an administrator, never chosen here.
  role: z.enum(['student', 'instructor']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
