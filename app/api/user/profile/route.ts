import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { updateUserSchema } from '@/lib/validation/user.schema';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      timezone: user.timezone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      defaultMinNotice: user.defaultMinNotice ?? 120,
      defaultMaxWindow: user.defaultMaxWindow ?? 60,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.parse(body);

    // Username uniqueness check if changing username
    if (parsed.username && parsed.username !== user.username) {
      const existingUser = await db.user.findUnique({
        where: { username: parsed.username },
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'This username is already taken by another user.' },
          { status: 409 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name !== undefined ? parsed.name : undefined,
        username: parsed.username !== undefined ? parsed.username : undefined,
        timezone: parsed.timezone !== undefined ? parsed.timezone : undefined,
        bio: parsed.bio !== undefined ? parsed.bio : undefined,
        avatarUrl: parsed.avatarUrl !== undefined ? parsed.avatarUrl : undefined,
        defaultMinNotice: parsed.defaultMinNotice !== undefined ? parsed.defaultMinNotice : undefined,
        defaultMaxWindow: parsed.defaultMaxWindow !== undefined ? parsed.defaultMaxWindow : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        username: updated.username,
        timezone: updated.timezone,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        defaultMinNotice: updated.defaultMinNotice,
        defaultMaxWindow: updated.defaultMaxWindow,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid profile settings payload' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
