import React from 'react';
import { db } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MeetlioLogo } from '@/components/brand/logo';
import { formatTimeInZone } from '@/lib/scheduling/timezone';
import { CheckCircle2, Calendar, Clock, Video, Globe, Download, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; bookingId?: string; cancelToken?: string; id?: string }>;
}) {
  const params = await searchParams;
  const targetToken = params.token || params.cancelToken;
  const targetId = params.bookingId || params.id;

  let booking = null;

  if (targetToken) {
    booking = await db.booking.findFirst({
      where: {
        OR: [
          { cancelToken: targetToken },
          { rescheduleToken: targetToken },
        ],
      },
      include: {
        user: {
          select: { name: true, username: true, timezone: true, avatarUrl: true },
        },
        eventType: {
          select: { name: true, duration: true, locationType: true },
        },
        answers: true,
      },
    });
  }

  if (!booking && targetId) {
    booking = await db.booking.findUnique({
      where: { id: targetId },
      include: {
        user: {
          select: { name: true, username: true, timezone: true, avatarUrl: true },
        },
        eventType: {
          select: { name: true, duration: true, locationType: true },
        },
        answers: true,
      },
    });
  }

  if (!booking) {
    notFound();
  }

  const host = booking.user;
  const eventType = booking.eventType;

  const startFormatted = formatTimeInZone(booking.startTime, booking.guestTimezone, 'EEEE, MMMM d, yyyy');
  const timeFormatted = `${formatTimeInZone(booking.startTime, booking.guestTimezone, 'hh:mm a')} - ${formatTimeInZone(booking.endTime, booking.guestTimezone, 'hh:mm a')}`;

  // Generate Google Calendar & Outlook Calendar Quick Add URLs
  const title = encodeURIComponent(`${eventType.name} with ${host.name}`);
  const details = encodeURIComponent(`Scheduled via Meetlio. Host: ${host.name} (${host.username})`);
  const isoStart = booking.startTime.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const isoEnd = booking.endTime.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${isoStart}/${isoEnd}&details=${details}`;
  const outlookCalUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${booking.startTime.toISOString()}&enddt=${booking.endTime.toISOString()}&body=${details}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mb-6 text-center">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>
      </div>

      <Card className="w-full max-w-2xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in">
        {/* Scheduled Success Header */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            You&apos;re Scheduled!
          </h1>
          <p className="text-xs text-slate-500">
            A calendar invitation and confirmation email have been sent to <strong>{booking.guestEmail}</strong>.
          </p>
        </div>

        {/* Meeting Details Grid */}
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{eventType.name}</h2>
            <Badge variant="success">CONFIRMED</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{startFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{timeFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{eventType.locationType.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{booking.guestTimezone}</span>
            </div>
          </div>
        </div>

        {/* Custom Question Answers */}
        {booking.answers && booking.answers.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Submitted Details</h3>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {booking.answers.map((ans) => (
                <div key={ans.id} className="flex flex-col">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{ans.questionLabel}:</span>
                  <span>{ans.answer}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add to Calendar & Action Buttons */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 text-center">Add to your calendar</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={googleCalUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Google Calendar
              </Button>
            </a>
            <a href={outlookCalUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Outlook Calendar
              </Button>
            </a>
            <a href={`/api/public/bookings/${booking.cancelToken}/calendar`} target="_blank">
              <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                Download .ics
              </Button>
            </a>
          </div>

          <div className="flex justify-center gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            {booking.rescheduleToken && (
              <Link href={`/reschedule/${booking.rescheduleToken}`} className="text-slate-600 hover:text-brand-600 flex items-center gap-1 font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </Link>
            )}
            {booking.cancelToken && (
              <Link href={`/cancel/${booking.cancelToken}`} className="text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                Cancel Appointment
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
