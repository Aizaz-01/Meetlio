import { db } from '@/lib/db/prisma';

export const userRepository = {
  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
    });
  },

  async findByUsername(username: string) {
    return db.user.findUnique({
      where: { username },
      include: {
        eventTypes: {
          where: { isActive: true },
        },
        availabilities: true,
      },
    });
  },

  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
    });
  },
};
