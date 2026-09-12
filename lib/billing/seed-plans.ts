import { db } from '@/lib/db/prisma';

export const DEFAULT_PLANS = [
  {
    slug: 'free',
    name: 'Free Tier',
    description: 'Essential scheduling features for individuals starting out',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    maxEventTypes: 1,
    maxBookingsPerMonth: 50,
    maxWebhooks: 1,
    analyticsEnabled: false,
    customBrandingEnabled: false,
    prioritySupport: false,
    isActive: true,
  },
  {
    slug: 'pro',
    name: 'Pro Tier',
    description: 'Unlimited event types, higher booking limits, and analytics for professionals',
    priceMonthly: 19,
    priceYearly: 190, // ~17% annual discount
    currency: 'USD',
    maxEventTypes: -1, // Unlimited
    maxBookingsPerMonth: 500,
    maxWebhooks: 10,
    analyticsEnabled: true,
    customBrandingEnabled: true,
    prioritySupport: false,
    isActive: true,
  },
  {
    slug: 'business',
    name: 'Business Tier',
    description: 'Unlimited capacity, webhooks, and priority dedicated support for teams',
    priceMonthly: 49,
    priceYearly: 490, // ~17% annual discount
    currency: 'USD',
    maxEventTypes: -1, // Unlimited
    maxBookingsPerMonth: -1, // Unlimited
    maxWebhooks: -1, // Unlimited
    analyticsEnabled: true,
    customBrandingEnabled: true,
    prioritySupport: true,
    isActive: true,
  },
];

/**
 * Ensures default plans exist in PostgreSQL.
 * Safe to execute multiple times (uses upsert).
 */
export async function seedDefaultPlans() {
  const seeded = [];
  for (const plan of DEFAULT_PLANS) {
    const record = await db.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        maxEventTypes: plan.maxEventTypes,
        maxBookingsPerMonth: plan.maxBookingsPerMonth,
        maxWebhooks: plan.maxWebhooks,
        analyticsEnabled: plan.analyticsEnabled,
        customBrandingEnabled: plan.customBrandingEnabled,
        prioritySupport: plan.prioritySupport,
        isActive: plan.isActive,
      },
      create: plan,
    });
    seeded.push(record);
  }
  return seeded;
}

/**
 * Resolves user's active subscription or assigns/returns default FREE plan subscription.
 */
export async function getOrCreateUserSubscription(userId: string) {
  await seedDefaultPlans();

  let sub = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    const freePlan = await db.plan.findUnique({ where: { slug: 'free' } });
    if (!freePlan) throw new Error('FREE plan not found in database');

    sub = await db.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: 'ACTIVE',
        provider: 'DEFAULT',
      },
      include: { plan: true },
    });
  }

  return sub;
}
