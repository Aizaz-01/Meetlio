import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrCreateUserSubscription } from '@/lib/billing/seed-plans';
import { getCurrentUsage } from '@/lib/billing/usage';
import { cancelSubscription, resumeSubscription } from '@/lib/billing/service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const [sub, usage] = await Promise.all([
      getOrCreateUserSubscription(user.id),
      getCurrentUsage(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: sub.id,
          status: sub.status,
          provider: sub.provider,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
        },
        plan: sub.plan,
        usage,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      const updated = await cancelSubscription(user.id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'resume') {
      const updated = await resumeSubscription(user.id);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Supported: cancel, resume' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
