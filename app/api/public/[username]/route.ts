import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const host = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        timezone: true,
        eventTypes: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            duration: true,
            locationType: true,
            locationInfo: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!host) {
      return NextResponse.json({ success: false, error: 'User workspace not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: host,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch public profile' },
      { status: 500 }
    );
  }
}
