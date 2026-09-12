import { z } from 'zod';

export const createBookingSchema = z.object({
  guestName: z
    .string({ required_error: 'Guest name is required' })
    .trim()
    .min(2, { message: 'Guest name must be at least 2 characters' })
    .max(100, { message: 'Guest name must be 100 characters or fewer' }),

  guestEmail: z
    .string({ required_error: 'Guest email is required' })
    .trim()
    .toLowerCase()
    .email({ message: 'Please enter a valid email address' }),

  guestTimezone: z
    .string({ required_error: 'Guest timezone is required' })
    .trim()
    .min(1, { message: 'Guest timezone is required' }),

  startTime: z
    .string({ required_error: 'Start time is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Start time must be a valid ISO 8601 datetime',
    }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
