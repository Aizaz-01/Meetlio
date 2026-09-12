import React from 'react';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeetlioLogo } from '@/components/brand/logo';
import { Clock, Globe, Video, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const host = await db.user.findUnique({
    where: { username },
    select: { name: true, bio: true },
  });

  if (!host) {
    return { title: 'User Not Found | Meetlio' };
  }

  return {
    title: `${host.name} — Schedule a Meeting | Meetlio`,
    description: host.bio || `Select a meeting type to schedule time with ${host.name}.`,
  };
}

export default async function PublicHostProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

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
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!host) {
    notFound();
  }

  const initials = host.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Header Logo */}
      <div className="mb-8 text-center">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>
      </div>

      <div className="w-full max-w-3xl space-y-6">
        {/* Host Info Header Card */}
        <Card className="p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shrink-0">
            {initials}
          </div>

          <div className="space-y-2 flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {host.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono text-slate-600 dark:text-slate-300">@{host.username}</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-brand-500" />
                {host.timezone || 'UTC'}
              </span>
            </div>
            {host.bio && (
              <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed max-w-xl">
                {host.bio}
              </p>
            )}
          </div>
        </Card>

        {/* Active Event Types List */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Available Meeting Types ({host.eventTypes.length})
          </div>

          {host.eventTypes.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-500">
              This host has no active meeting types currently available for scheduling.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {host.eventTypes.map((evt) => (
                <Link key={evt.id} href={`/booking/${host.username}/${evt.slug}`}>
                  <Card hoverEffect className="p-6 transition-all group border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {evt.name}
                        </h3>
                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-brand-500" />
                            {evt.duration} mins
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-slate-400" />
                            {evt.locationType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
