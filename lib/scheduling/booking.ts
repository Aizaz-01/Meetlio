import { addMinutes, parseISO } from 'date-fns';

export interface ValidateBookingRequest {
  startTimeISO: string;
  durationMinutes: number;
  existingBookings: { startTime: Date; endTime: Date }[];
}

export function validateBookingSlot(request: ValidateBookingRequest): {
  isValid: boolean;
  endTimeISO?: string;
  error?: string;
} {
  try {
    const start = parseISO(request.startTimeISO);
    if (isNaN(start.getTime())) {
      return { isValid: false, error: 'Invalid start time' };
    }

    if (start.getTime() < Date.now()) {
      return { isValid: false, error: 'Cannot book a time slot in the past' };
    }

    const end = addMinutes(start, request.durationMinutes);

    for (const booking of request.existingBookings) {
      const bStart = new Date(booking.startTime).getTime();
      const bEnd = new Date(booking.endTime).getTime();

      if (start.getTime() < bEnd && end.getTime() > bStart) {
        return { isValid: false, error: 'The selected time slot is no longer available' };
      }
    }

    return {
      isValid: true,
      endTimeISO: end.toISOString(),
    };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'Validation error' };
  }
}
