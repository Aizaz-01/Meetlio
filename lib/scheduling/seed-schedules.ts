import { db } from '@/lib/db/prisma';

export async function getOrCreateDefaultSchedule(userId: string) {
  let schedule = await db.availabilitySchedule.findFirst({
    where: { userId, isDefault: true },
  });

  if (!schedule) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    schedule = await db.availabilitySchedule.create({
      data: {
        userId,
        name: 'Working Hours (Default)',
        isDefault: true,
        timeZone: user?.timezone || 'UTC',
      },
    });

    // Link unassigned availability records
    await db.availability.updateMany({
      where: { userId, scheduleId: null },
      data: { scheduleId: schedule.id },
    });
  }

  return schedule;
}
