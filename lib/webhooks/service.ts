import crypto from 'crypto';
import { db } from '@/lib/db/prisma';

export interface TriggerWebhookInput {
  userId: string;
  event: 'booking.created' | 'booking.cancelled' | 'booking.rescheduled' | 'booking.completed';
  payload: Record<string, any>;
}

export async function triggerWebhooks(input: TriggerWebhookInput): Promise<void> {
  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: {
        userId: input.userId,
        isActive: true,
      },
    });

    const matching = endpoints.filter((ep) => ep.events.includes(input.event) || ep.events.includes('*'));

    if (matching.length === 0) return;

    const bodyString = JSON.stringify({
      event: input.event,
      timestamp: new Date().toISOString(),
      data: input.payload,
    });

    for (const ep of matching) {
      // Non-blocking fire & retry
      dispatchWebhookWithRetry(ep.url, ep.secret, bodyString).catch(() => {});
    }
  } catch (err) {
    console.error('Webhook Dispatch Non-Blocking Error:', err);
  }
}

async function dispatchWebhookWithRetry(url: string, secret: string, bodyString: string): Promise<boolean> {
  const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Meetlio-Signature': signature,
          'User-Agent': 'Meetlio-Webhook-Dispatcher/1.0',
        },
        body: bodyString,
      });

      if (res.ok) return true;
    } catch {
      if (attempt === maxAttempts) return false;
      // Exponential backoff delay (100ms, 200ms)
      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }
  return false;
}
