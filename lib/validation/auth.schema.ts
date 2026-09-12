import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }).toLowerCase().trim(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
    email: z.string().email({ message: 'Please enter a valid email address' }).toLowerCase().trim(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(30, { message: 'Username cannot exceed 30 characters' })
      .regex(/^[a-z0-9_-]+$/, {
        message: 'Username can only contain lowercase letters, numbers, underscores, and hyphens',
      }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' }),
    timezone: z.string().min(1, { message: 'Timezone is required' }).default('UTC'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }).toLowerCase().trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: 'Reset token is required' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
