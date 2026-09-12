import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validation/auth.schema';
import { generateSecureToken } from '@/lib/auth/tokens';
import { db } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.parse(body);
    const email = parsed.email.toLowerCase().trim();

    try {
      const user = await db.user.findUnique({
        where: { email },
      });

      if (user) {
        const { rawToken, tokenHash } = generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        });

        // Abstracted notification/email service logger (for dev verification)
        console.log(`[Meetlio Email Service] Reset link generated for ${email}: /reset-password?token=${rawToken}`);
      }
    } catch (err) {
      console.warn('Forgot password DB handling:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been issued.',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid email format' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been issued.',
    });
  }
}
