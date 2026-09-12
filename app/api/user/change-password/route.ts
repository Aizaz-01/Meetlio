import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { comparePassword, hashPassword } from '@/lib/auth/password';
import { changePasswordSchema } from '@/lib/validation/user.schema';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);

    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Password authentication not configured for this account' },
        { status: 400 }
      );
    }

    const isValidCurrent = await comparePassword(parsed.currentPassword, user.passwordHash);
    if (!isValidCurrent) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password' },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(parsed.newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid password payload' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
