import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createCheckoutSession } from '@/lib/billing/service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planSlug, interval } = body;

    // Security Guard: Reject client price attempts
    if (body.price !== undefined || body.amount !== undefined) {
      return NextResponse.json(
        { success: false, error: 'Custom price manipulation is strictly prohibited' },
        { status: 400 }
      );
    }

    if (!planSlug || typeof planSlug !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid planSlug is required' }, { status: 400 });
    }

    if (!interval || (interval !== 'monthly' && interval !== 'yearly')) {
      return NextResponse.json(
        { success: false, error: 'Billing interval must be monthly or yearly' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession({
      userId: user.id,
      planSlug,
      interval,
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    if (err.message === 'PLAN_NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Selected plan is invalid or inactive' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
