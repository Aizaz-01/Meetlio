import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';
import { seedDefaultPlans } from '@/lib/billing/seed-plans';

export async function GET() {
  try {
    let plans = await db.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        maxEventTypes: true,
        maxBookingsPerMonth: true,
        maxWebhooks: true,
        analyticsEnabled: true,
        customBrandingEnabled: true,
        prioritySupport: true,
      },
      orderBy: { priceMonthly: 'asc' },
    });

    if (plans.length === 0) {
      await seedDefaultPlans();
      plans = await db.plan.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          priceMonthly: true,
          priceYearly: true,
          currency: true,
          maxEventTypes: true,
          maxBookingsPerMonth: true,
          maxWebhooks: true,
          analyticsEnabled: true,
          customBrandingEnabled: true,
          prioritySupport: true,
        },
        orderBy: { priceMonthly: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch billing plans' },
      { status: 500 }
    );
  }
}
