import { z } from 'zod';

export const locationTypeEnum = z.enum(['GOOGLE_MEET', 'ZOOM', 'IN_PERSON', 'PHONE', 'CUSTOM']);

export const createEventTypeSchema = z.object({
  name: z.string().trim().min(2, { message: 'Event name must be at least 2 characters' }).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
    .optional(),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().min(5, { message: 'Duration must be at least 5 minutes' }),
  locationType: locationTypeEnum,
  locationInfo: z.string().max(300).optional(),
  isActive: z.boolean().default(true),
  bufferBefore: z.number().int().min(0).default(0),
  bufferAfter: z.number().int().min(0).default(0),
  minimumNotice: z.number().int().min(0).default(120),
  maximumBookingWindow: z.number().int().min(1).default(60),
});

export const updateEventTypeSchema = createEventTypeSchema.partial();

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>;
