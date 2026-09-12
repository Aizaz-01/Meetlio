import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Video, Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function UpcomingMeetings() {
  const sampleMeetings = [
    {
      id: 'b1',
      guestName: 'Sarah Jenkins',
      guestEmail: 'sarah.j@techcorp.io',
      eventTitle: '30 Minute Discovery Call',
      date: 'Today, 2:30 PM - 3:00 PM',
      duration: '30 min',
      location: 'Google Meet',
      status: 'CONFIRMED',
    },
    {
      id: 'b2',
      guestName: 'David Miller',
      guestEmail: 'david@designagency.com',
      eventTitle: 'Product Architecture Review',
      date: 'Tomorrow, 10:00 AM - 11:00 AM',
      duration: '60 min',
      location: 'Google Meet',
      status: 'CONFIRMED',
    },
    {
      id: 'b3',
      guestName: 'Elena Rostova',
      guestEmail: 'elena@startup.co',
      eventTitle: '15 Minute Quick Connect',
      date: 'Aug 28, 4:00 PM - 4:15 PM',
      duration: '15 min',
      location: 'Phone Call',
      status: 'CONFIRMED',
    },
  ];

  return (
    <Card className="p-6">
      <CardHeader className="flex flex-row items-center justify-between mb-6">
        <div>
          <CardTitle>Upcoming Meetings</CardTitle>
          <CardDescription>Your next scheduled client & team sessions</CardDescription>
        </div>
        <Link href="/dashboard/bookings">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View all
          </Button>
        </Link>
      </CardHeader>

      <div className="space-y-3">
        {sampleMeetings.map((m) => (
          <div
            key={m.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {m.eventTitle}
                  </h4>
                  <Badge variant="success">{m.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {m.guestName} ({m.guestEmail})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>{m.date}</span>
              </div>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
