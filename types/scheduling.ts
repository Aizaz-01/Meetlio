// Scheduling Specific Types

export interface TimeSlot {
  time: string;       // e.g. "09:00 AM"
  datetime: string;   // ISO 8601 representation
  startTime: string;  // ISO 8601 representation for slot start
  endTime: string;    // ISO 8601 representation for slot end
  available: boolean;
  reason?: string;
}

export interface DayScheduleSlots {
  date: string;       // YYYY-MM-DD
  timezone: string;
  slots: TimeSlot[];
}

export interface AvailabilityOverrideItem {
  id?: string;
  date: string | Date; // YYYY-MM-DD or Date
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startTime?: string | null;
  endTime?: string | null;
}

export interface SlotGeneratorParams {
  hostTimezone: string;
  guestTimezone?: string;
  targetDate: string; // YYYY-MM-DD
  durationMinutes: number;
  bufferBefore?: number;
  bufferAfter?: number;
  minimumNotice?: number; // Minimum notice requirement in minutes
  maximumBookingWindow?: number; // Maximum days ahead allowed
  availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
  overrides?: AvailabilityOverrideItem[];
  existingBookings: {
    startTime: Date;
    endTime: Date;
    bufferBefore?: number;
    bufferAfter?: number;
  }[];
  externalCalendarEvents?: {
    startTime: Date;
    endTime: Date;
  }[];
}
