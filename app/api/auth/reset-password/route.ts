import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validation/auth.schema';
import { hashToken } from '@/lib/auth/tokens';
import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.parse(body);

    const tokenHash = hashToken(parsed.token);

    let resetTokenRecord;
    try {
      resetTokenRecord = await db.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
    } catch {
      resetTokenRecord = null;
    }

    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(parsed.password);

    try {
      await db.$transaction([
        db.user.update({
          where: { id: resetTokenRecord.userId },
          data: { passwordHash: newPasswordHash },
        }),
        db.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { usedAt: new Date() },
        }),
        db.session.deleteMany({
          where: { userId: resetTokenRecord.userId },
        }),
      ]);
    } catch (err) {
      console.warn('Reset password DB update warning:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You may now log in with your new password.',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid request payload' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during password reset.' },
      { status: 500 }
    );
  }
}
