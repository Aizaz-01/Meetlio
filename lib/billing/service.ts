import { db } from '@/lib/db/prisma';
import { getOrCreateUserSubscription, seedDefaultPlans } from '@/lib/billing/seed-plans';
import { recordAuditLog } from '@/lib/audit/service';
import { triggerWebhooks } from '@/lib/webhooks/service';
import crypto from 'crypto';

export interface CreateCheckoutInput {
  userId: string;
  planSlug: string;
  interval: 'monthly' | 'yearly';
}

export async function createCheckoutSession(input: CreateCheckoutInput) {
  await seedDefaultPlans();

  const plan = await db.plan.findUnique({
    where: { slug: input.planSlug },
  });

  if (!plan || !plan.isActive) {
    throw new Error('PLAN_NOT_FOUND');
  }

  const priceAmount = input.interval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const isDevMode = !process.env.BILLING_SECRET_KEY;

  if (isDevMode || process.env.BILLING_PROVIDER === 'DEV_SIMULATOR') {
    // Development mode simulator: Directly update subscription in PostgreSQL
    const currentSub = await getOrCreateUserSubscription(input.userId);

    const updatedSub = await db.subscription.update({
      where: { userId: input.userId },
      data: {
        planId: plan.id,
        status: 'ACTIVE',
        provider: 'DEV_SIMULATOR',
        providerSubscriptionId: `sub_sim_${Date.now()}`,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      },
      include: { plan: true },
    });

    recordAuditLog({
      userId: input.userId,
      action: 'SUBSCRIPTION_CREATED',
      entityType: 'USER',
      entityId: input.userId,
      metadata: { planSlug: plan.slug, interval: input.interval, price: priceAmount },
    }).catch(() => {});

    triggerWebhooks({
      userId: input.userId,
      event: 'booking.completed', // Standard webhook dispatch
      payload: { planSlug: plan.slug, status: 'ACTIVE' },
    }).catch(() => {});

    return {
      checkoutUrl: `/dashboard/billing?success=true&plan=${plan.slug}`,
      sessionId: `sess_sim_${Date.now()}`,
      planSlug: plan.slug,
      interval: input.interval,
      price: priceAmount,
      isSimulated: true,
    };
  }

  // Production Provider Session (e.g. Stripe checkout)
  return {
    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=pending`,
    sessionId: `sess_prod_${Date.now()}`,
    planSlug: plan.slug,
    interval: input.interval,
    price: priceAmount,
    isSimulated: false,
  };
}

export async function getSubscription(userId: string) {
  return await getOrCreateUserSubscription(userId);
}

export async function cancelSubscription(userId: string) {
  const sub = await getOrCreateUserSubscription(userId);

  const updated = await db.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
    },
    include: { plan: true },
  });

  recordAuditLog({
    userId,
    action: 'SUBSCRIPTION_CANCELLED',
    entityType: 'USER',
    entityId: userId,
    metadata: { planSlug: updated.plan.slug },
  }).catch(() => {});

  return updated;
}

export async function resumeSubscription(userId: string) {
  const sub = await getOrCreateUserSubscription(userId);

  const updated = await db.subscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
      status: 'ACTIVE',
    },
    include: { plan: true },
  });

  recordAuditLog({
    userId,
    action: 'SUBSCRIPTION_UPDATED',
    entityType: 'USER',
    entityId: userId,
    metadata: { planSlug: updated.plan.slug, status: 'ACTIVE' },
  }).catch(() => {});

  return updated;
}

export function verifyBillingWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
