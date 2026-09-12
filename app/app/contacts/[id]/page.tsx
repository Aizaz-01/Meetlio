import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Building, Calendar, Plus, Clock, Video } from 'lucide-react';

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;

  const contact = await db.contact.findFirst({
    where: { id, userId: user.id },
    include: {
      activities: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!contact) {
    notFound();
  }

  // Fetch past & upcoming bookings with this contact email
  const bookings = await db.booking.findMany({
    where: {
      userId: user.id,
      guestEmail: contact.email,
    },
    include: { eventType: true },
    orderBy: { startTime: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div className="flex items-center justify-between">
        <Link href="/app/contacts">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Contacts
          </Button>
        </Link>

        {/* Schedule directly with this contact */}
        <Link href={`/${user.username}`}>
          <Button size="sm" variant="primary" leftIcon={<Calendar className="w-4 h-4" />}>
            Schedule with {contact.name.split(' ')[0]}
          </Button>
        </Link>
      </div>

      {/* Header Profile Card */}
      <Card className="p-6 bg-slate-900 text-white border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-xl shadow-lg">
            {contact.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-white">{contact.name}</h1>
            <div className="text-xs text-slate-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                {contact.email}
              </span>
              {contact.company && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  {contact.company}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Meeting History & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Booking & Meeting History ({bookings.length})
            </h3>

            {bookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No meetings recorded with this contact yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{b.eventType?.name || 'Meeting'}</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        {new Date(b.startTime).toLocaleDateString()} at {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant={b.status === 'CANCELLED' ? 'danger' : 'success'}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Notes & Custom Fields */}
        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Contact Notes
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {contact.notes || 'No notes added for this contact.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
