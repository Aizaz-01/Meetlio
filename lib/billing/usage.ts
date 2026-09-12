import { db } from '@/lib/db/prisma';
import { getOrCreateUserSubscription } from '@/lib/billing/seed-plans';

export interface UsageDetails {
  plan: {
    name: string;
    slug: string;
    maxEventTypes: number;
    maxBookingsPerMonth: number;
    maxWebhooks: number;
    analyticsEnabled: boolean;
  };
  bookingCount: number;
  eventTypeCount: number;
  webhookCount: number;
  bookingPercentage: number;
  eventTypePercentage: number;
  webhookPercentage: number;
  warningState: 'OK' | 'WARNING_50' | 'WARNING_80' | 'WARNING_90' | 'LIMIT_REACHED';
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getCurrentUsage(userId: string): Promise<UsageDetails> {
  const sub = await getOrCreateUserSubscription(userId);
  const plan = sub.plan;
  const currentMonth = getCurrentMonthKey();

  const startOfMonth = new Date(`${currentMonth}-01T00:00:00.000Z`);

  const [bookingCount, eventTypeCount, webhookCount] = await Promise.all([
    db.booking.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    }),
    db.eventType.count({
      where: { userId, isActive: true },
    }),
    db.webhookEndpoint.count({
      where: { userId, isActive: true },
    }),
  ]);

  const bookingPercentage =
    plan.maxBookingsPerMonth === -1 ? 0 : Math.min(100, Math.round((bookingCount / plan.maxBookingsPerMonth) * 100));

  const eventTypePercentage =
    plan.maxEventTypes === -1 ? 0 : Math.min(100, Math.round((eventTypeCount / plan.maxEventTypes) * 100));

  const webhookPercentage =
    plan.maxWebhooks === -1 ? 0 : Math.min(100, Math.round((webhookCount / plan.maxWebhooks) * 100));

  let warningState: UsageDetails['warningState'] = 'OK';
  if (bookingPercentage >= 100 || eventTypePercentage >= 100 || webhookPercentage >= 100) {
    warningState = 'LIMIT_REACHED';
  } else if (bookingPercentage >= 90) {
    warningState = 'WARNING_90';
  } else if (bookingPercentage >= 80) {
    warningState = 'WARNING_80';
  } else if (bookingPercentage >= 50) {
    warningState = 'WARNING_50';
  }

  return {
    plan: {
      name: plan.name,
      slug: plan.slug,
      maxEventTypes: plan.maxEventTypes,
      maxBookingsPerMonth: plan.maxBookingsPerMonth,
      maxWebhooks: plan.maxWebhooks,
      analyticsEnabled: plan.analyticsEnabled,
    },
    bookingCount,
    eventTypeCount,
    webhookCount,
    bookingPercentage,
    eventTypePercentage,
    webhookPercentage,
    warningState,
  };
}

export async function canCreateBooking(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const sub = await getOrCreateUserSubscription(userId);
  const plan = sub.plan;
  if (plan.maxBookingsPerMonth === -1) {
    return { allowed: true, limit: -1, current: 0 };
  }

  const currentMonth = getCurrentMonthKey();
  const startOfMonth = new Date(`${currentMonth}-01T00:00:00.000Z`);

  const current = await db.booking.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
  });

  return {
    allowed: current < plan.maxBookingsPerMonth,
    limit: plan.maxBookingsPerMonth,
    current,
  };
}

export async function canCreateEventType(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const sub = await getOrCreateUserSubscription(userId);
  const plan = sub.plan;
  if (plan.maxEventTypes === -1) {
    return { allowed: true, limit: -1, current: 0 };
  }

  const current = await db.eventType.count({
    where: { userId, isActive: true },
  });

  return {
    allowed: current < plan.maxEventTypes,
    limit: plan.maxEventTypes,
    current,
  };
}

export async function canCreateWebhook(userId: string): Promise<{ allowed: boolean; limit: number; current: number }> {
  const sub = await getOrCreateUserSubscription(userId);
  const plan = sub.plan;
  if (plan.maxWebhooks === -1) {
    return { allowed: true, limit: -1, current: 0 };
  }

  const current = await db.webhookEndpoint.count({
    where: { userId, isActive: true },
  });

  return {
    allowed: current < plan.maxWebhooks,
    limit: plan.maxWebhooks,
    current,
  };
}

export async function incrementBookingUsage(userId: string): Promise<void> {
  const month = getCurrentMonthKey();
  await db.usageRecord.upsert({
    where: {
      userId_month: { userId, month },
    },
    update: {
      bookingCount: { increment: 1 },
    },
    create: {
      userId,
      month,
      bookingCount: 1,
    },
  });
}
