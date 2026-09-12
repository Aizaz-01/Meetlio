import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { availabilityOverrideSchema } from '@/lib/validation/availability.schema';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const overrides = await db.availabilityOverride.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: overrides,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch date overrides' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = availabilityOverrideSchema.parse(body);

    const targetDate = new Date(`${parsed.date}T00:00:00.000Z`);

    // Check if an override already exists for this date
    const existingOverride = await db.availabilityOverride.findFirst({
      where: {
        userId: user.id,
        date: targetDate,
      },
    });

    let overrideRecord;
    if (existingOverride) {
      overrideRecord = await db.availabilityOverride.update({
        where: { id: existingOverride.id },
        data: {
          type: parsed.type,
          startTime: parsed.type === 'AVAILABLE' ? parsed.startTime : null,
          endTime: parsed.type === 'AVAILABLE' ? parsed.endTime : null,
        },
      });
    } else {
      overrideRecord = await db.availabilityOverride.create({
        data: {
          userId: user.id,
          date: targetDate,
          type: parsed.type,
          startTime: parsed.type === 'AVAILABLE' ? parsed.startTime : null,
          endTime: parsed.type === 'AVAILABLE' ? parsed.endTime : null,
        },
      });
    }

    return NextResponse.json({ success: true, data: overrideRecord }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid override parameters' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to create date override' }, { status: 500 });
  }
}
