import { z } from 'zod';

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function hasOverlappingWindows(
  windows: { startTime: string; endTime: string }[]
): boolean {
  if (windows.length <= 1) return false;

  const sorted = [...windows].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = timeToMinutes(sorted[i - 1].endTime);
    const currStart = timeToMinutes(sorted[i].startTime);
    if (currStart < prevEnd) {
      return true;
    }
  }

  return false;
}

export const baseAvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, { message: 'Start time must be in HH:mm format' }),
  endTime: z.string().regex(timeRegex, { message: 'End time must be in HH:mm format' }),
  isActive: z.boolean().default(true),
});

export const availabilityWindowSchema = baseAvailabilityWindowSchema.refine(
  (data) => timeToMinutes(data.startTime) < timeToMinutes(data.endTime),
  {
    message: 'Start time must be strictly before end time',
    path: ['endTime'],
  }
);

export const updateAvailabilityWindowSchema = baseAvailabilityWindowSchema.partial();

export const baseOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' }),
  type: z.enum(['AVAILABLE', 'UNAVAILABLE']),
  startTime: z.string().regex(timeRegex, { message: 'Start time must be in HH:mm format' }).optional().nullable(),
  endTime: z.string().regex(timeRegex, { message: 'End time must be in HH:mm format' }).optional().nullable(),
});

export const availabilityOverrideSchema = baseOverrideSchema.refine(
  (data) => {
    if (data.type === 'AVAILABLE') {
      if (!data.startTime || !data.endTime) return false;
      return timeToMinutes(data.startTime) < timeToMinutes(data.endTime);
    }
    return true;
  },
  {
    message: 'Available overrides require a valid start time before end time',
    path: ['endTime'],
  }
);

export const updateOverrideSchema = baseOverrideSchema.partial();

export type AvailabilityInput = z.infer<typeof availabilityWindowSchema>;
export type OverrideInput = z.infer<typeof availabilityOverrideSchema>;
