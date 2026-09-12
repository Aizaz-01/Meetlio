import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Video,
  User,
  Mail,
  Phone,
  Globe,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  FileText,
  History,
} from 'lucide-react';

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;

  const booking = await db.booking.findFirst({
    where: { id, userId: user.id },
    include: {
      eventType: true,
      answers: true,
      reminders: true,
      notifications: true,
    },
  });

  if (!booking) {
    notFound();
  }

  // Find or check associated Contact in CRM
  const contact = await db.contact.findFirst({
    where: { userId: user.id, email: booking.guestEmail || booking.inviteeEmail || '' },
    include: { activities: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Back Button */}
      <Link href="/app/meetings">
        <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Meetings
        </Button>
      </Link>

      {/* Header Banner */}
      <Card className="p-6 bg-slate-900 text-white border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={booking.status === 'CANCELLED' ? 'danger' : 'success'}>
              {booking.status}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">ID: {booking.id}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">
            {booking.eventType?.name || 'Meeting'} with {booking.guestName || booking.inviteeName}
          </h1>
          <p className="text-xs text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>
              {new Date(booking.startTime).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} from{' '}
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to{' '}
              {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.guestTimezone || 'UTC'})
            </span>
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invitee Details & Answers */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-4 h-4 text-brand-600" /> Invitee Profile
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Name</span>
                <span className="text-slate-900 dark:text-white font-semibold">{booking.guestName || booking.inviteeName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Email</span>
                <span className="text-slate-900 dark:text-white font-semibold">{booking.guestEmail || booking.inviteeEmail}</span>
              </div>
              {booking.guestPhone && (
                <div>
                  <span className="text-slate-400 font-bold block">Phone</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{booking.guestPhone}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 font-bold block">Invitee Timezone</span>
                <span className="text-slate-900 dark:text-white font-semibold">{booking.guestTimezone || 'UTC'}</span>
              </div>
            </div>
          </Card>

          {/* Invitee Form Responses */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-indigo-600" /> Booking Questions & Answers
            </h3>

            {booking.answers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No custom question responses submitted.</p>
            ) : (
              <div className="space-y-3">
                {booking.answers.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">{a.questionLabel}</span>
                    <span className="text-slate-900 dark:text-white">{a.answer || a.value}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Contact CRM Timeline */}
          {contact && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <History className="w-4 h-4 text-emerald-600" /> CRM Contact Activity
              </h3>

              <div className="space-y-2">
                {contact.activities.map((act) => (
                  <div key={act.id} className="text-xs flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{act.type}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Event Summary & Location */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Location & Access
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-bold">Conferencing Method</span>
                <div className="flex items-center gap-2 mt-1 text-slate-900 dark:text-white font-semibold">
                  <Video className="w-4 h-4 text-brand-500" />
                  <span>{booking.location || 'Google Meet Video Call'}</span>
                </div>
              </div>

              {booking.eventType && (
                <div>
                  <span className="text-slate-400 block font-bold">Event Type</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{booking.eventType.name} ({booking.eventType.duration} mins)</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
