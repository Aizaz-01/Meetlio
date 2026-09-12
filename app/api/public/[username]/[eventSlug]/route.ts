import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { generateAvailableSlots } from '@/lib/scheduling/slots';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; eventSlug: string }> }
) {
  const { username, eventSlug } = await params;
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const host = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        timezone: true,
        avatarUrl: true,
        bio: true,
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

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Inactive events must not be bookable
    if (!eventType.isActive) {
      return NextResponse.json(
        { success: false, error: 'This booking link is currently inactive or unavailable.' },
        { status: 404 }
      );
    }

    const hostAvailabilities = await db.availability.findMany({
      where: { userId: host.id },
    });

    const slots = generateAvailableSlots({
      hostTimezone: host.timezone || 'UTC',
      guestTimezone: searchParams.get('tz') || 'UTC',
      targetDate,
      durationMinutes: eventType.duration,
      availabilities: hostAvailabilities.length > 0 ? hostAvailabilities : DEFAULT_WEEKLY_AVAILABILITY,
      existingBookings: [],
    });

    return NextResponse.json({
      success: true,
      data: {
        host: {
          name: host.name,
          username: host.username,
          timezone: host.timezone,
          bio: host.bio,
          avatarUrl: host.avatarUrl,
        },
        eventType: {
          id: eventType.id,
          name: eventType.name,
          slug: eventType.slug,
          description: eventType.description,
          duration: eventType.duration,
          locationType: eventType.locationType,
          locationInfo: eventType.locationInfo,
          bufferBefore: eventType.bufferBefore,
          bufferAfter: eventType.bufferAfter,
          minimumNotice: eventType.minimumNotice,
          maximumBookingWindow: eventType.maximumBookingWindow,
          isActive: eventType.isActive,
        },
        date: targetDate,
        availableSlots: slots,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Event booking details unavailable' },
      { status: 400 }
    );
  }
}
