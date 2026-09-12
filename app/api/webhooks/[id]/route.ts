import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { recordAuditLog } from '@/lib/audit/service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await db.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Webhook endpoint not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    const body = await request.json();

    const updated = await db.webhookEndpoint.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        events: Array.isArray(body.events) ? body.events : undefined,
        url: typeof body.url === 'string' && body.url.startsWith('http') ? body.url.trim() : undefined,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update webhook endpoint' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await db.webhookEndpoint.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Webhook endpoint not found' }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden: Unauthorized access' }, { status: 403 });
    }

    await db.webhookEndpoint.delete({
      where: { id },
    });

    recordAuditLog({
      userId: user.id,
      action: 'WEBHOOK_DELETED',
      entityType: 'WEBHOOK',
      entityId: id,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Webhook endpoint deleted' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete webhook endpoint' },
      { status: 500 }
    );
  }
}
