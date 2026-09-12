import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { MeetingsTableActions } from './meetings-table-actions';
import { Calendar, Clock, Video, BookOpenCheck, ArrowRight, User } from 'lucide-react';

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const activeTab = params.tab || 'upcoming';

  const now = new Date();

  // Status filters
  let whereCondition: any = { userId: user.id };
  if (activeTab === 'upcoming') {
    whereCondition = {
      userId: user.id,
      startTime: { gte: now },
      status: { in: ['CONFIRMED', 'SCHEDULED'] },
    };
  } else if (activeTab === 'past') {
    whereCondition = {
      userId: user.id,
      startTime: { lt: now },
      status: { in: ['CONFIRMED', 'SCHEDULED', 'COMPLETED', 'NO_SHOW'] },
    };
  } else if (activeTab === 'cancelled') {
    whereCondition = {
      userId: user.id,
      status: 'CANCELLED',
    };
  }

  const bookings = await db.booking.findMany({
    where: whereCondition,
    include: {
      eventType: true,
      answers: true,
    },
    orderBy: { startTime: activeTab === 'past' ? 'desc' : 'asc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Meetings & Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View, manage, cancel, reschedule, and track attendee status across all booked meetings.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <Link
          href="/app/meetings?tab=upcoming"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>Upcoming</span>
        </Link>

        <Link
          href="/app/meetings?tab=past"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'past'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Past</span>
        </Link>

        <Link
          href="/app/meetings?tab=cancelled"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'cancelled'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Cancelled</span>
        </Link>
      </div>

      {/* Meetings Table / List */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        {bookings.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<BookOpenCheck className="w-12 h-12 text-slate-400" />}
              title={`No ${activeTab} meetings`}
              description={`You currently have no ${activeTab} appointments.`}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === 'CANCELLED' ? 'danger' : b.attendance === 'NO_SHOW' ? 'warning' : 'brand'} className="text-[10px]">
                      {b.attendance === 'NO_SHOW' ? 'NO SHOW' : b.status}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(b.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-500" />
                    <span>{b.guestName || b.inviteeName}</span>
                    <span className="text-xs text-slate-400 font-normal">({b.guestEmail || b.inviteeEmail})</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {b.eventType?.name || 'Meeting'} ({b.eventType?.duration || 30} mins)
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Video className="w-3.5 h-3.5" />
                      {b.location || 'Google Meet'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/app/meetings/${b.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Details
                    </Button>
                  </Link>

                  <MeetingsTableActions booking={b} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
