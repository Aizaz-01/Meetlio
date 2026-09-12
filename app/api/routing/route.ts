import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const form = await db.routingForm.findFirst({
      where: { slug },
      include: {
        questions: { orderBy: { order: 'asc' } },
        rules: true,
        user: { select: { username: true, name: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, form });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const forms = await db.routingForm.findMany({
      where: { userId: user.id },
      include: { questions: true, rules: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, forms });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, title, slug, description, questions, rules } = body;

    const formTitle = name || title;
    if (!formTitle) {
      return NextResponse.json({ success: false, error: 'Form title is required' }, { status: 400 });
    }

    const form = await db.routingForm.create({
      data: {
        userId: user.id,
        name: formTitle.trim(),
        title: formTitle.trim(),
        slug: slug || 'form-' + Date.now(),
        description: description || null,
        questions: Array.isArray(questions) && questions.length > 0 ? {
          createMany: {
            data: questions.map((q: any, idx: number) => ({
              label: q.label,
              type: q.type || 'SHORT_TEXT',
              options: q.options || [],
              required: q.required ?? true,
              order: idx,
            })),
          },
        } : undefined,
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
      include: { questions: true, rules: true },
    });

    return NextResponse.json({ success: true, form }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
