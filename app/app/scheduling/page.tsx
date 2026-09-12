import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CopyButton } from '@/components/ui/copy-button';
import { EventTypeCardActions } from './event-type-card-actions';
import {
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Link as LinkIcon,
  Video,
  Users,
} from 'lucide-react';

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const activeTab = params.tab || 'event-types';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Fetch real data
  const [eventTypes, polls] = await Promise.all([
    db.eventType.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        hosts: { include: { user: true } },
      },
    }),
    db.meetingPoll.findMany({
      where: { userId: user.id },
      include: { options: true, votes: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Scheduling Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your scheduling links, custom event types, one-off meetings, and group polls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/app/scheduling/new">
            <Button variant="primary" size="sm" className="bg-brand-600 hover:bg-brand-700 font-semibold" leftIcon={<Plus className="w-4 h-4" />}>
              Create Event Type
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <Link
          href="/app/scheduling?tab=event-types"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'event-types'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Types</span>
          <Badge variant="neutral" className="ml-1 text-[10px]">
            {eventTypes.length}
          </Badge>
        </Link>

        <Link
          href="/app/scheduling?tab=one-off"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'one-off'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>One-Off Meetings</span>
        </Link>

        <Link
          href="/app/scheduling?tab=polls"
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'polls'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Meeting Polls</span>
          <Badge variant="neutral" className="ml-1 text-[10px]">
            {polls.length}
          </Badge>
        </Link>
      </div>

      {/* TAB 1: EVENT TYPES */}
      {activeTab === 'event-types' && (
        <div className="space-y-6">
          {eventTypes.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-slate-400" />}
              title="No event types created yet"
              description="Create your first event type (e.g. 30-min strategy call) to start taking bookings."
              action={
                <Link href="/app/scheduling/new">
                  <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                    Create First Event Type
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventTypes.map((evt) => {
                const bookingUrl = `${appUrl}/${user.username}/${evt.slug}`;
                return (
                  <Card key={evt.id} hoverEffect className="p-6 flex flex-col justify-between relative overflow-hidden border-slate-200 dark:border-slate-800">
                    <div className="space-y-4">
                      {/* Top Bar with Color Pill & Active Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-xs"
                            style={{ backgroundColor: evt.color || '#3b82f6' }}
                          />
                          <Badge variant="neutral" className="text-[10px] uppercase font-bold">
                            {evt.kind || evt.eventKind || '1:1'}
                          </Badge>
                        </div>
                        <Badge variant={evt.isActive ? 'success' : 'neutral'} className="text-[10px]">
                          {evt.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Title & Info */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                          {evt.name || evt.title}
                        </h3>
                        {evt.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {/* Details Meta */}
                      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-500" />
                          <span>{evt.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-brand-500" />
                          <span className="truncate">{evt.locationType || 'Google Meet'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-500" />
                          <span>Host: {user.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <CopyButton value={bookingUrl} label="Copy Link" className="text-xs" />
                        <Link href={`/${user.username}/${evt.slug}`} target="_blank">
                          <Button size="sm" variant="ghost" className="p-2 text-slate-400 hover:text-slate-700" title="View Booking Page">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>

                      {/* Dropdown Menu for Edit/Duplicate/Delete */}
                      <EventTypeCardActions eventType={evt} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ONE-OFF MEETINGS */}
      {activeTab === 'one-off' && (
        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">One-Off Meeting Links</h3>
            <p className="text-xs text-slate-500">
              Need to schedule a single meeting without creating a permanent event type? Generate a temporary single-use booking link.
            </p>
          </div>
          <Link href="/app/scheduling/one-off">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Create One-Off Meeting Link
            </Button>
          </Link>
        </Card>
      )}

      {/* TAB 3: MEETING POLLS */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Group Meeting Polls</h3>
            <Link href="/app/scheduling/polls">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Create Poll
              </Button>
            </Link>
          </div>

          {polls.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-12 h-12 text-slate-400" />}
              title="No meeting polls created"
              description="Offer multiple date options and let your group vote on the best time."
              action={
                <Link href="/app/scheduling/polls">
                  <Button variant="primary">Create Meeting Poll</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {polls.map((p) => (
                <Card key={p.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white">{p.title}</h4>
                    <Badge variant={p.isFinalized ? 'success' : 'neutral'}>
                      {p.isFinalized ? 'Finalized' : 'Active Poll'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{p.description || 'No description'}</p>
                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>{p.options.length} candidate slots</span>
                    <span>{p.votes.length} total votes</span>
                  </div>
                  <div className="pt-2 border-t flex justify-end">
                    <Link href={`/app/scheduling/polls?id=${p.id}`}>
                      <Button size="sm" variant="outline">Manage Poll</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
