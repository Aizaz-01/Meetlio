import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  Link as LinkIcon,
  Zap,
  BarChart3,
  BookOpenCheck,
  Video,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';

export default async function HomeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Fetch real data from Prisma
  const [upcomingBookings, todayBookings, eventTypesCount, totalBookingsCount, recentContacts] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: user.id,
        startTime: { gte: now },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: { eventType: true },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    db.booking.findMany({
      where: {
        userId: user.id,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'SCHEDULED'] },
      },
      include: { eventType: true },
      orderBy: { startTime: 'asc' },
    }),
    db.eventType.count({ where: { userId: user.id } }),
    db.booking.count({ where: { userId: user.id } }),
    db.contact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${user.username}`;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge variant="brand" className="mb-2 bg-brand-500/20 text-brand-300 border-brand-500/30">
                ✨ Welcome back
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {user.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                You have <strong>{todayBookings.length}</strong> meeting{todayBookings.length === 1 ? '' : 's'} scheduled for today. Here is your real-time Meetlio overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/${user.username}`} target="_blank">
                <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View Public Booking Page
                </Button>
              </Link>
              <Link href="/app/scheduling/new">
                <Button size="sm" variant="primary" className="bg-brand-600 hover:bg-brand-500 text-white shadow-lg" leftIcon={<Plus className="w-4 h-4" />}>
                  New Event Type
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="pt-2 flex items-center gap-3 text-xs bg-black/20 p-3 rounded-2xl border border-white/10 max-w-lg">
            <LinkIcon className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-mono text-slate-200 truncate">{publicUrl}</span>
            <CopyButton value={publicUrl} className="ml-auto bg-white/10 text-white hover:bg-white/20 text-xs px-2.5 py-1 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Schedule</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{todayBookings.length}</div>
            <span className="text-[11px] text-slate-500">Meetings today</span>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Calls</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{upcomingBookings.length}</div>
            <span className="text-[11px] text-slate-500">Confirmed ahead</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Event Types</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{eventTypesCount}</div>
            <span className="text-[11px] text-slate-500">Configured links</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl">
            <CalendarDays className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalBookingsCount}</div>
            <span className="text-[11px] text-slate-500">Lifetime appointments</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Today / Upcoming & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Upcoming & Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500">Your next scheduled sessions</p>
              </div>
              <Link href="/app/meetings">
                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="w-12 h-12 text-slate-400" />}
                title="No upcoming meetings"
                description="Share your booking link to let clients schedule calls with you."
                action={
                  <Link href="/app/scheduling">
                    <Button size="sm" variant="primary">
                      Manage Event Types
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" className="text-[10px]">
                          {b.eventType?.name || 'Meeting'}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {b.guestName || b.inviteeName} ({b.guestEmail || b.inviteeEmail})
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-brand-500" />
                        <span>{b.location || 'Google Meet Video Call'}</span>
                      </div>
                    </div>

                    <Link href={`/app/meetings/${b.id}`}>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Contacts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Contacts</h3>
                <p className="text-xs text-slate-500">People who booked meetings recently</p>
              </div>
              <Link href="/app/contacts">
                <Button size="sm" variant="outline">
                  All Contacts
                </Button>
              </Link>
            </div>

            {recentContacts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No contacts saved yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentContacts.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </div>
                    </div>
                    <Link href={`/app/contacts/${c.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs">
                        View CRM
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Quick Actions Hub */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
            </h3>

            <div className="space-y-2.5">
              <Link href="/app/scheduling/new" className="block">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-xl">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Create Event Type</div>
                      <div className="text-[11px] text-slate-400">1:1, Group, or Round Robin</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/app/scheduling/one-off" className="block">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Create One-off Link</div>
                      <div className="text-[11px] text-slate-400">Single-use meeting link</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/app/scheduling/polls" className="block">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Create Meeting Poll</div>
                      <div className="text-[11px] text-slate-400">Find best time with group</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>

              <Link href="/app/analytics" className="block">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-brand-500 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">View Analytics</div>
                      <div className="text-[11px] text-slate-400">Booking insights & completion</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
