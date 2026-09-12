// Shared Types for Meetlio

export type LocationType = 'GOOGLE_MEET' | 'ZOOM' | 'IN_PERSON' | 'PHONE';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  timezone: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventTypeItem {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  duration: number; // minutes
  locationType: LocationType;
  locationInfo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayAvailability {
  id?: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  isActive: boolean;
}

export interface BookingItem {
  id: string;
  userId: string;
  eventTypeId: string;
  eventType?: EventTypeItem;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  status: BookingStatus;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  rescheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, any>;
}
