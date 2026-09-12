import { db } from '@/lib/db/prisma';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';

export const availabilityService = {
  async getUserAvailability(userId: string) {
    const list = await db.availability.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' },
    });

    if (!list || list.length === 0) {
      return DEFAULT_WEEKLY_AVAILABILITY;
    }

    return list;
  },
};
