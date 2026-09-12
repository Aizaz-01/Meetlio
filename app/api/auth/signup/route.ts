import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation/auth.schema';
import { hashPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { DEFAULT_WEEKLY_AVAILABILITY } from '@/lib/scheduling/availability';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse(body);

    const email = parsed.email.toLowerCase().trim();
    const username = parsed.username.toLowerCase().trim();

    // 1. Check duplicate email or username in PostgreSQL
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'This username is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.password);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // 2. Perform atomic PostgreSQL transaction for User + Availabilities + EventTypes + Session
    let createdUser;
    try {
      createdUser = await db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: parsed.name.trim(),
            email,
            username,
            passwordHash,
            timezone: parsed.timezone,
            onboardingCompleted: false,
            availabilities: {
              createMany: {
                data: DEFAULT_WEEKLY_AVAILABILITY.map((a) => ({
                  dayOfWeek: a.dayOfWeek,
                  startTime: a.startTime,
                  endTime: a.endTime,
                  isActive: a.isActive,
                })),
              },
            },
            eventTypes: {
              createMany: {
                data: [
                  {
                    name: '30 Minute Discovery Call',
                    slug: '30min',
                    duration: 30,
                    locationType: 'GOOGLE_MEET',
                    description: 'Introductory consultation to discuss your project goals.',
                    isActive: true,
                  },
                  {
                    name: '15 Minute Quick Call',
                    slug: '15min',
                    duration: 15,
                    locationType: 'PHONE',
                    description: 'Fast status update or Q&A call.',
                    isActive: true,
                  },
                ],
              },
            },
          },
        });

        // Create Session record atomically
        await tx.session.create({
          data: {
            userId: user.id,
            sessionToken,
            expiresAt,
          },
        });

        return user;
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'Email or username';
        return NextResponse.json(
          { success: false, error: `${field} is already registered.` },
          { status: 400 }
        );
      }

      console.error('[Signup Transaction Failure]:', err);
      return NextResponse.json(
        { success: false, error: 'Database service unavailable. Registration failed.' },
        { status: 500 }
      );
    }

    // 3. Set HttpOnly cookie only after PostgreSQL transaction completes successfully
    await setSessionCookie(sessionToken, expiresAt);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          username: createdUser.username,
          timezone: createdUser.timezone,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Invalid registration payload' },
        { status: 400 }
      );
    }

    console.error('[Signup Request Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during signup.' },
      { status: 500 }
    );
  }
}
