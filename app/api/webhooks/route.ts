import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import crypto from 'crypto';
import { recordAuditLog } from '@/lib/audit/service';
import { canCreateWebhook } from '@/lib/billing/usage';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const endpoints = await db.webhookEndpoint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: endpoints,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  // Server-side Plan Limit Check
  const limitCheck = await canCreateWebhook(user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PLAN_LIMIT_REACHED',
          message: 'Maximum webhook endpoints limit reached for your plan. Please upgrade your plan to register more webhooks.',
          details: {
            resource: 'webhooks',
            limit: limitCheck.limit,
            current: limitCheck.current,
          },
        },
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { url, events } = body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: 'A valid HTTP/HTTPS webhook URL is required' },
        { status: 400 }
      );
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const eventList = Array.isArray(events) && events.length > 0 ? events : ['booking.created', 'booking.cancelled', 'booking.rescheduled'];

    const endpoint = await db.webhookEndpoint.create({
      data: {
        userId: user.id,
        url: url.trim(),
        secret,
        events: eventList,
        isActive: true,
      },
    });

    recordAuditLog({
      userId: user.id,
      action: 'WEBHOOK_CREATED',
      entityType: 'WEBHOOK',
      entityId: endpoint.id,
      metadata: { url: endpoint.url, events: endpoint.events },
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        data: {
          id: endpoint.id,
          url: endpoint.url,
          secret: endpoint.secret, // Revealed ONCE on creation
          events: endpoint.events,
          isActive: endpoint.isActive,
          createdAt: endpoint.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create webhook endpoint' },
      { status: 500 }
    );
  }
}
