import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const forms = await db.routingForm.findMany({
      where: { userId: user.id },
      include: { rules: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: forms });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch routing forms' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, name, description, rules } = body;

    const formTitle = name || title;
    if (!formTitle) {
      return NextResponse.json(
        { success: false, error: 'Form title is required' },
        { status: 400 }
      );
    }

    const form = await db.routingForm.create({
      data: {
        userId: user.id,
        name: formTitle.trim(),
        title: formTitle.trim(),
        description: description || null,
        rules: Array.isArray(rules) && rules.length > 0 ? {
          createMany: {
            data: rules.map((r: any) => ({
              conditionField: r.conditionField || 'Company Size',
              conditionValue: r.conditionValue || '100+',
              destinationType: r.destinationType || r.targetType || 'EVENT_TYPE',
              targetType: r.targetType || r.destinationType || 'EVENT_TYPE',
              destinationId: r.destinationId || r.targetValue || '30min-meeting',
              targetValue: r.targetValue || r.destinationId || '30min-meeting',
            })),
          },
        } : undefined,
      },
      include: { rules: true },
    });

    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create routing form' },
      { status: 500 }
    );
  }
}
