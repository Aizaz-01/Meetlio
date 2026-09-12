import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(30, { message: 'Username cannot exceed 30 characters' })
    .regex(/^[a-z0-9_-]+$/, {
      message: 'Username can only contain lowercase letters, numbers, underscores, and hyphens',
    })
    .optional(),
  timezone: z.string().min(1, { message: 'Timezone is required' }).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url({ message: 'Avatar URL must be a valid URL' }).optional().or(z.literal('')),
  defaultMinNotice: z.number().min(0, { message: 'Minimum notice cannot be negative' }).optional(),
  defaultMaxWindow: z.number().min(1, { message: 'Maximum booking window must be at least 1 day' }).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
