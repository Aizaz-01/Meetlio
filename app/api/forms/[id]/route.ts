import { NextResponse } from 'next/server';
import { db } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const form = await db.routingForm.findUnique({
      where: { id },
      include: { rules: true },
    });

    if (!form) {
      return NextResponse.json({ success: false, error: 'Routing form not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: form });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch routing form' },
      { status: 500 }
    );
  }
}
