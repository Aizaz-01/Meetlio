import React from 'react';
import { db } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PublicBookingClient } from '@/app/booking/[username]/[eventSlug]/booking-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>;
}): Promise<Metadata> {
  const { username, eventSlug } = await params;

  const host = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true },
  });

  if (!host) {
    return { title: 'Booking Page | Meetlio' };
  }

  const eventType = await db.eventType.findUnique({
    where: {
      userId_slug: {
        userId: host.id,
        slug: eventSlug,
      },
    },
    select: { name: true, title: true },
  });

  return {
    title: eventType ? `Book ${eventType.name || eventType.title} with ${host.name} | Meetlio` : `${host.name} Scheduling | Meetlio`,
    description: `Select a date and time to schedule an appointment with ${host.name}.`,
  };
}

export default async function PublicDirectBookingPage({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>;
}) {
  const { username, eventSlug } = await params;

  const host = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      timezone: true,
      bio: true,
      avatarUrl: true,
    },
  });

  if (!host) {
    notFound();
  }

  const eventType = await db.eventType.findUnique({
    where: {
      userId_slug: {
        userId: host.id,
        slug: eventSlug,
      },
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!eventType || (!eventType.isActive && !eventType.active)) {
    notFound();
  }

  return (
    <PublicBookingClient
      host={host}
      eventType={eventType}
    />
  );
}
