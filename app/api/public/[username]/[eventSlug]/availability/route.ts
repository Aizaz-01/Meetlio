import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { generateAvailableSlots } from '@/lib/scheduling/slots';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';
import { AvailabilityOverrideItem } from '@/types/scheduling';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; eventSlug: string }> }
) {
  const { username, eventSlug } = await params;
  const { searchParams } = new URL(request.url);

  const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const guestTimezone = searchParams.get('timezone') || searchParams.get('tz') || undefined;

  try {
    const host = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        timezone: true,
        bio: true,
        avatarUrl: true,
      },
    });

    if (!host) {
      return NextResponse.json(
        { success: false, error: 'User workspace not found' },
        { status: 404 }
      );
    }

    const eventType = await db.eventType.findUnique({
      where: {
        userId_slug: {
          userId: host.id,
          slug: eventSlug,
        },
      },
    });

    if (!eventType || (!eventType.isActive && !eventType.active)) {
      return NextResponse.json(
        { success: false, error: 'This booking link is currently inactive or unavailable.' },
        { status: 404 }
      );
    }

    // Fetch host schedule data (respecting eventType.scheduleId if assigned)
    let targetScheduleId = eventType.scheduleId;
    if (!targetScheduleId) {
      const defaultSched = await db.availabilitySchedule.findFirst({
        where: { userId: host.id, isDefault: true },
      });
      if (defaultSched) {
        targetScheduleId = defaultSched.id;
      }
    }

    const hostAvailabilities = await db.availability.findMany({
      where: {
        userId: host.id,
        ...(targetScheduleId ? { scheduleId: targetScheduleId } : {}),
      },
    });

    const hostOverridesRaw = await db.availabilityOverride.findMany({
      where: { userId: host.id },
    });

    const hostOverrides: AvailabilityOverrideItem[] = hostOverridesRaw.map((o) => ({
      id: o.id,
      date: o.date,
      type: o.type as 'AVAILABLE' | 'UNAVAILABLE',
      startTime: o.startTime,
      endTime: o.endTime,
    }));

    const confirmedBookings = await db.booking.findMany({
      where: {
        userId: host.id,
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: {
        eventType: {
          select: {
            bufferBefore: true,
            bufferAfter: true,
          },
        },
      },
    });

    const existingBookings = confirmedBookings.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bufferBefore: b.eventType?.bufferBefore || 0,
      bufferAfter: b.eventType?.bufferAfter || 0,
    }));

    const slots = generateAvailableSlots({
      hostTimezone: host.timezone || 'UTC',
      guestTimezone: guestTimezone || host.timezone || 'UTC',
      targetDate,
      durationMinutes: eventType.duration,
      bufferBefore: eventType.bufferBefore || 0,
      bufferAfter: eventType.bufferAfter || 0,
      minimumNotice: eventType.minimumNotice ?? 0,
      maximumBookingWindow: eventType.maximumBookingWindow ?? 60,
      availabilities: hostAvailabilities.length > 0 ? hostAvailabilities : DEFAULT_WEEKLY_AVAILABILITY,
      overrides: hostOverrides,
      existingBookings,
    });

    return NextResponse.json({
      success: true,
      data: slots,
      availableSlots: slots,
      meta: {
        host: {
          name: host.name,
          username: host.username,
          timezone: host.timezone,
        },
        eventType: {
          id: eventType.id,
          name: eventType.name,
          slug: eventType.slug,
          duration: eventType.duration,
        },
        date: targetDate,
        guestTimezone: guestTimezone || host.timezone || 'UTC',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Availability calculation failed' },
      { status: 500 }
    );
  }
}
