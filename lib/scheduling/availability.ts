import { DayAvailability } from '@/types';

export const DEFAULT_WEEKLY_AVAILABILITY: DayAvailability[] = [
  { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isActive: false }, // Sun
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },  // Mon
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },  // Tue
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isActive: true },  // Wed
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isActive: true },  // Thu
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true },  // Fri
  { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isActive: false }, // Sat
];

/**
 * Returns all active availability windows for a given day of the week.
 */
export function getAvailabilityWindowsForDay(
  availabilities: DayAvailability[],
  dayOfWeek: number
): DayAvailability[] {
  return availabilities.filter((a) => a.dayOfWeek === dayOfWeek && a.isActive);
}
