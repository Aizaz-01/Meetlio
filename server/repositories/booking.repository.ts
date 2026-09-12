import { db } from '@/lib/db/prisma';

export const bookingRepository = {
  async findByUserId(userId: string) {
    return db.booking.findMany({
      where: { userId },
      include: { eventType: true },
      orderBy: { startTime: 'asc' },
    });
  },

  async findById(id: string) {
    return db.booking.findUnique({
      where: { id },
      include: { eventType: true, user: true },
    });
  },

  async findOverlapping(userId: string, start: Date, end: Date) {
    return db.booking.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
  },
};
