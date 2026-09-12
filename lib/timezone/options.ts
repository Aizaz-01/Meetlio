export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: '-08:00' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi', offset: '+04:00' },
  { value: 'Asia/Karachi', label: 'Karachi, Islamabad', offset: '+05:00' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Seoul', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne', offset: '+11:00' },
];

export function getUserDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
