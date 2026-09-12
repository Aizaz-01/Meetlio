import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const workflows = await db.workflow.findMany({
      where: { userId: user.id },
      include: {
        actions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: workflows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, trigger, actionType, actionConfig } = body;

    if (!name || !trigger) {
      return NextResponse.json({ success: false, error: 'Workflow name and trigger are required' }, { status: 400 });
    }

    const workflow = await db.workflow.create({
      data: {
        userId: user.id,
        name: String(name).trim(),
        trigger: String(trigger),
        isActive: true,
        actions: {
          create: [
            {
              type: actionType || 'SEND_EMAIL',
              config: actionConfig ? JSON.stringify(actionConfig) : null,
              order: 0,
            },
          ],
        },
      },
      include: {
        actions: true,
      },
    });

    return NextResponse.json({ success: true, data: workflow }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to create workflow' }, { status: 500 });
  }
}
