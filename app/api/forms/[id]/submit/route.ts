import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { answers } = body;

    const form = await db.routingForm.findUnique({
      where: { id },
      include: {
        rules: true,
        user: { select: { username: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ success: false, error: 'Routing form not found' }, { status: 404 });
    }

    let destinationSlug = '30min-meeting';
    if (answers && typeof answers === 'object') {
      for (const rule of form.rules) {
        if (rule.conditionField) {
          const val = answers[rule.conditionField];
          if (val && String(val).toLowerCase().trim() === String(rule.conditionValue || '').toLowerCase().trim()) {
            destinationSlug = rule.targetValue || rule.destinationId || '30min-meeting';
            break;
          }
        }
      }
    }

    const redirectUrl = `/${form.user.username}/${destinationSlug}`;

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl,
        destinationSlug,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit routing form' },
      { status: 500 }
    );
  }
}
