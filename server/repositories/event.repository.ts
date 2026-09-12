import { db } from '@/lib/db/prisma';

export const eventRepository = {
  async findByUserId(userId: string) {
    return db.eventType.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByUserAndSlug(userId: string, slug: string) {
    return db.eventType.findUnique({
      where: {
        userId_slug: { userId, slug },
      },
    });
  },

  async findById(id: string) {
    return db.eventType.findUnique({
      where: { id },
    });
  },
};
