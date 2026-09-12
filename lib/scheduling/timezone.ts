import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export function formatTimeInZone(date: Date | string, timeZone: string, formatStr: string = 'hh:mm a'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return formatInTimeZone(d, timeZone, formatStr);
  } catch {
    return format(d, formatStr);
  }
}

export function parseZonedTime(dateStr: string, timeStr: string, timeZone: string): Date {
  // dateStr = "YYYY-MM-DD", timeStr = "HH:mm"
  const isoString = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(isoString, timeZone);
}
