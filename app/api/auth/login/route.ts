import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation/auth.schema';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);
    const email = parsed.email.toLowerCase().trim();

    let user;
    try {
      user = await db.user.findUnique({
        where: { email },
      });
    } catch (dbErr) {
      console.error('[Login Database Failure]:', dbErr);
      return NextResponse.json(
        { success: false, error: 'Database service unavailable. Login failed.' },
        { status: 500 }
      );
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(parsed.password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session in PostgreSQL (throws error if DB fails)
    try {
      await createSession(user.id);
    } catch (sessionErr) {
      console.error('[Login Session Creation Failure]:', sessionErr);
      return NextResponse.json(
        { success: false, error: 'Database service unavailable. Session creation failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        timezone: user.timezone,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid email or password.' },
        { status: 400 }
      );
    }

    console.error('[Login Request Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid email or password.' },
      { status: 401 }
    );
  }
}
