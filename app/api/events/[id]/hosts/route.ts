import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const eventType = await db.eventType.findUnique({
      where: { id },
      include: {
        hosts: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!eventType || eventType.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized or event type not found' }, { status: 403 });
    }

    // List available team hosts / co-hosts in the organization
    const availableUsers = await db.user.findMany({
      select: { id: true, name: true, email: true, username: true, avatarUrl: true },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        assignedHosts: eventType.hosts,
        availableUsers,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch event hosts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { hosts } = body; // Array of { userId: string, priority: number }

    if (!Array.isArray(hosts)) {
      return NextResponse.json({ success: false, error: 'Hosts list is required' }, { status: 400 });
    }

    const eventType = await db.eventType.findUnique({
      where: { id },
    });

    if (!eventType || eventType.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized or event type not found' }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      // Clear existing hosts
      await tx.eventTypeHost.deleteMany({
        where: { eventTypeId: id },
      });

      // Insert updated host assignments
      if (hosts.length > 0) {
        await tx.eventTypeHost.createMany({
          data: hosts.map((h, idx) => ({
            eventTypeId: id,
            userId: h.userId,
            priority: Number(h.priority ?? idx),
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event hosts updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update event hosts' },
      { status: 500 }
    );
  }
}
