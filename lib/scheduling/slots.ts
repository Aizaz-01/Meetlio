import { SlotGeneratorParams, TimeSlot } from '@/types/scheduling';
import { getAvailabilityWindowsForDay } from './availability';
import { hasTimeConflict } from './conflicts';
import { formatTimeInZone } from './timezone';
import { addMinutes, parseISO, differenceInDays } from 'date-fns';

export function generateAvailableSlots(params: SlotGeneratorParams): TimeSlot[] {
  const {
    hostTimezone,
    guestTimezone,
    targetDate,
    durationMinutes,
    bufferBefore = 0,
    bufferAfter = 0,
    minimumNotice = 120,
    maximumBookingWindow = 60,
    availabilities,
    overrides = [],
    existingBookings = [],
    externalCalendarEvents = [],
  } = params;

  // 1. Check Maximum Booking Window constraint
  const targetDateObj = parseISO(`${targetDate}T00:00:00`);
  const nowStr = new Date().toISOString().split('T')[0];
  const todayDateObj = parseISO(`${nowStr}T00:00:00`);
  const daysAhead = differenceInDays(targetDateObj, todayDateObj);

  if (daysAhead < 0 || daysAhead > maximumBookingWindow) {
    return [];
  }

  // 2. Check Date-Specific Overrides (Priority 1)
  const matchingOverride = overrides.find((o) => {
    let overrideDateStr = '';
    if (o.date instanceof Date) {
      const y = o.date.getFullYear();
      const m = String(o.date.getMonth() + 1).padStart(2, '0');
      const d = String(o.date.getDate()).padStart(2, '0');
      overrideDateStr = `${y}-${m}-${d}`;
    } else {
      overrideDateStr = String(o.date).split('T')[0];
    }
    return overrideDateStr === targetDate;
  });

  let workingWindows: { startTime: string; endTime: string }[] = [];

  if (matchingOverride) {
    if (matchingOverride.type === 'UNAVAILABLE') {
      // Host explicitly set this date unavailable
      return [];
    } else if (matchingOverride.type === 'AVAILABLE' && matchingOverride.startTime && matchingOverride.endTime) {
      workingWindows = [
        {
          startTime: matchingOverride.startTime,
          endTime: matchingOverride.endTime,
        },
      ];
    }
  } else {
    // 3. Fallback to Recurring Weekly Availability (Priority 2)
    const dayOfWeek = targetDateObj.getDay(); // 0 = Sun, 6 = Sat
    const activeDayWindows = getAvailabilityWindowsForDay(availabilities, dayOfWeek);

    if (activeDayWindows.length === 0) {
      return [];
    }

    workingWindows = activeDayWindows.map((w) => ({
      startTime: w.startTime,
      endTime: w.endTime,
    }));
  }

  const nowMs = Date.now();
  const minNoticeMs = minimumNotice * 60 * 1000;
  const slots: TimeSlot[] = [];

  // Combined external busy events with existing bookings
  const allConflictEvents = [
    ...existingBookings,
    ...externalCalendarEvents.map((e) => ({
      startTime: e.startTime,
      endTime: e.endTime,
      bufferBefore: 0,
      bufferAfter: 0,
    })),
  ];

  // 4. Generate Time Slots across all active working windows
  for (const window of workingWindows) {
    const [startHour, startMin] = window.startTime.split(':').map(Number);
    const [endHour, endMin] = window.endTime.split(':').map(Number);

    const windowStartMinutes = startHour * 60 + startMin;
    const windowEndMinutes = endHour * 60 + endMin;

    let currentMinutes = windowStartMinutes;

    while (currentMinutes + durationMinutes <= windowEndMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      const slotStartISO = `${targetDate}T${timeString}:00`;
      const slotStartDate = parseISO(slotStartISO);
      const slotEndDate = addMinutes(slotStartDate, durationMinutes);

      const slotStartMs = slotStartDate.getTime();
      let available = true;
      let reason: string | undefined = undefined;

      // Rule: Minimum Notice requirement
      if (slotStartMs < nowMs + minNoticeMs) {
        available = false;
        reason = 'Minimum notice requirement';
      }

      // Rule: Existing Bookings & External Calendar Conflict Prevention
      if (available && hasTimeConflict(slotStartDate, slotEndDate, allConflictEvents, bufferBefore, bufferAfter)) {
        available = false;
        reason = 'Slot booked or external calendar busy';
      }

      slots.push({
        time: formatTimeInZone(slotStartDate, guestTimezone || hostTimezone, 'hh:mm a'),
        datetime: slotStartDate.toISOString(),
        startTime: slotStartDate.toISOString(),
        endTime: slotEndDate.toISOString(),
        available,
        reason,
      });

      // Step by 15 or 30 min increments
      const step = durationMinutes >= 30 ? 30 : durationMinutes;
      currentMinutes += step;
    }
  }

  return slots;
}
