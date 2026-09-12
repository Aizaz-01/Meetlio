import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { sendReminderNotification } from '@/lib/email/service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-cron-secret') || searchParams.get('secret');

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
  }

  const now = new Date();
  const nowMs = now.getTime();

  let count24h = 0;
  let count1h = 0;
  let errorCount = 0;

  try {
    // 1. Process 24-Hour Reminders (23h to 25h window)
    const start24hWindowMin = new Date(nowMs + 23 * 60 * 60 * 1000);
    const start24hWindowMax = new Date(nowMs + 25 * 60 * 60 * 1000);

    const eligible24h = await db.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminder24hSentAt: null,
        startTime: {
          gte: start24hWindowMin,
          lte: start24hWindowMax,
        },
      },
      include: {
        user: true,
        eventType: true,
      },
    });

    for (const booking of eligible24h) {
      try {
        // Atomic update to mark sent and prevent duplicate sending
        const updated = await db.booking.updateMany({
          where: {
            id: booking.id,
            reminder24hSentAt: null,
          },
          data: {
            reminder24hSentAt: new Date(),
          },
        });

        if (updated.count > 0) {
          await sendReminderNotification({
            booking,
            host: booking.user,
            eventType: booking.eventType,
            reminderLabel: '24 Hours',
          });
          count24h++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    // 2. Process 1-Hour Reminders (45m to 75m window)
    const start1hWindowMin = new Date(nowMs + 45 * 60 * 1000);
    const start1hWindowMax = new Date(nowMs + 75 * 60 * 1000);

    const eligible1h = await db.booking.findMany({
      where: {
        status: 'CONFIRMED',
        reminder1hSentAt: null,
        startTime: {
          gte: start1hWindowMin,
          lte: start1hWindowMax,
        },
      },
      include: {
        user: true,
        eventType: true,
      },
    });

    for (const booking of eligible1h) {
      try {
        const updated = await db.booking.updateMany({
          where: {
            id: booking.id,
            reminder1hSentAt: null,
          },
          data: {
            reminder1hSentAt: new Date(),
          },
        });

        if (updated.count > 0) {
          await sendReminderNotification({
            booking,
            host: booking.user,
            eventType: booking.eventType,
            reminderLabel: '1 Hour',
          });
          count1h++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: count24h + count1h,
      reminder24h: count24h,
      reminder1h: count1h,
      errors: errorCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
