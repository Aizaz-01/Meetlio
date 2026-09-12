import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, username, timezone, startTime, endTime, calendarProvider, firstEvent } = body;

    // Update user profile and set onboardingCompleted = true
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(username ? { username: username.trim().toLowerCase() } : {}),
        ...(timezone ? { timezone } : {}),
        onboardingCompleted: true,
      },
    });

    // Create default availability schedule if user doesn't have one
    let schedule = await db.availabilitySchedule.findFirst({
      where: { userId: user.id },
    });

    if (!schedule) {
      schedule = await db.availabilitySchedule.create({
        data: {
          userId: user.id,
          name: 'Working Hours',
          isDefault: true,
          timeZone: timezone || 'UTC',
          timezone: timezone || 'UTC',
          availabilities: {
            create: [1, 2, 3, 4, 5].map((day) => ({
              userId: user.id,
              dayOfWeek: day,
              startTime: startTime || '09:00',
              endTime: endTime || '17:00',
              isActive: true,
            })),
          },
        },
      });
    }

    // Create first event type if specified
    if (firstEvent && firstEvent.name) {
      const slug = firstEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'meeting';
      const existingEvent = await db.eventType.findFirst({
        where: { userId: user.id, slug },
      });

      if (!existingEvent) {
        await db.eventType.create({
          data: {
            userId: user.id,
            name: firstEvent.name,
            title: firstEvent.name,
            slug,
            duration: firstEvent.duration || 30,
            locationType: firstEvent.locationType || 'GOOGLE_MEET',
            locationInfo: firstEvent.locationType === 'GOOGLE_MEET' ? 'Google Meet Video Call' : 'Video Conference',
            scheduleId: schedule.id,
            isActive: true,
            active: true,
          },
        });
      }
    }

    // Record calendar integration mock connection if provider chosen
    if (calendarProvider) {
      await db.calendarConnection.upsert({
        where: { userId_provider: { userId: user.id, provider: calendarProvider } },
        update: { status: 'CONNECTED', active: true },
        create: {
          userId: user.id,
          provider: calendarProvider,
          providerAccountEmail: user.email,
          status: 'CONNECTED',
          active: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
