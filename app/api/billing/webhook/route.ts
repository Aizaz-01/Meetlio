import { NextResponse } from 'next/server';
import { verifyBillingWebhookSignature } from '@/lib/billing/service';
import { db } from '@/lib/db/prisma';
import { recordAuditLog } from '@/lib/audit/service';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-billing-signature') || request.headers.get('stripe-signature');
    const webhookSecret = process.env.BILLING_WEBHOOK_SECRET || 'dev_billing_webhook_secret';

    const isValid = verifyBillingWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    if (!event || !data) {
      return NextResponse.json({ success: false, error: 'Invalid payload structure' }, { status: 400 });
    }

    const { userId, planSlug, status, providerSubscriptionId } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId in event data' }, { status: 400 });
    }

    // Idempotent processing check
    if (providerSubscriptionId) {
      const existingSub = await db.subscription.findUnique({
        where: { providerSubscriptionId },
      });
      if (existingSub && existingSub.status === status && event === 'subscription.updated') {
        return NextResponse.json({ success: true, message: 'Event already processed' });
      }
    }

    const targetPlan = planSlug ? await db.plan.findUnique({ where: { slug: planSlug } }) : null;

    if (event === 'subscription.created' || event === 'subscription.updated' || event === 'payment.succeeded') {
      const updatedSub = await db.subscription.upsert({
        where: { userId },
        update: {
          status: status || 'ACTIVE',
          planId: targetPlan ? targetPlan.id : undefined,
          providerSubscriptionId: providerSubscriptionId || undefined,
          cancelAtPeriodEnd: false,
        },
        create: {
          userId,
          planId: targetPlan ? targetPlan.id : (await db.plan.findUnique({ where: { slug: 'free' } }))!.id,
          status: status || 'ACTIVE',
          providerSubscriptionId: providerSubscriptionId || `sub_wh_${Date.now()}`,
        },
      });

      recordAuditLog({
        userId,
        action: event === 'subscription.created' ? 'SUBSCRIPTION_CREATED' : 'SUBSCRIPTION_UPDATED',
        entityType: 'USER',
        entityId: userId,
        metadata: { event, status: updatedSub.status },
      }).catch(() => {});
    } else if (event === 'subscription.cancelled' || event === 'payment.failed') {
      const updatedSub = await db.subscription.update({
        where: { userId },
        data: {
          status: event === 'payment.failed' ? 'PAST_DUE' : 'CANCELLED',
        },
      });

      recordAuditLog({
        userId,
        action: event === 'payment.failed' ? 'PAYMENT_FAILED' : 'SUBSCRIPTION_CANCELLED',
        entityType: 'USER',
        entityId: userId,
        metadata: { event, status: updatedSub.status },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Billing webhook processed' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
