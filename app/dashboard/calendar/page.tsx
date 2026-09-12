'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Calendar as CalendarIcon, Clock, User, Mail, Video, ChevronLeft, ChevronRight, Download, RefreshCw, XCircle } from 'lucide-react';
import { formatTimeInZone } from '@/lib/scheduling/timezone';

export default function DashboardCalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      setLoading(true);
      try {
        const res = await fetch('/api/bookings?limit=100');
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.data?.bookings)) {
            setBookings(data.data.bookings);
          } else if (Array.isArray(data.data)) {
            setBookings(data.data);
          }
        }
      } catch {}
      setLoading(false);
    }
    loadBookings();
  }, []);

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const next = new Date(currentDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(next);
  };

  const handleBookingClick = (b: any) => {
    setSelectedBooking(b);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Scheduled Calendar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual calendar view of all your upcoming and past appointments
          </p>
        </div>

        {/* View & Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => handleNavigate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigate('today')}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Date Header */}
      <Card className="p-4 flex items-center justify-between bg-slate-900 text-white border-none shadow-lg">
        <div className="flex items-center gap-2 font-bold text-sm">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          <span>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          {bookings.length} Total Meetings Scheduled
        </div>
      </Card>

      {/* Bookings List / Calendar Grid View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-500">
          No appointments scheduled for this period. Share your public booking link to start receiving meetings!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => (
            <Card
              key={b.id}
              hoverEffect
              onClick={() => handleBookingClick(b)}
              className="p-5 cursor-pointer space-y-3 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'}>
                  {b.status}
                </Badge>
                <span className="text-xs font-mono text-slate-400">{b.eventType?.duration || 30} mins</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {b.eventType?.name || 'Meeting'} with {b.guestName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {b.guestEmail}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  <span>{formatTimeInZone(new Date(b.startTime), b.guestTimezone, 'EEE, MMM d @ hh:mm a')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.eventType?.locationType || 'Google Meet'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Meeting Details"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedBooking.eventType?.name}</h3>
                <span className="text-slate-400 font-mono text-[10px]">ID: {selectedBooking.id}</span>
              </div>
              <Badge variant={selectedBooking.status === 'CONFIRMED' ? 'success' : 'neutral'}>
                {selectedBooking.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <User className="w-4 h-4 text-brand-500" />
                <span>Guest: {selectedBooking.guestName} ({selectedBooking.guestEmail})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Clock className="w-4 h-4 text-brand-500" />
                <span>{formatTimeInZone(new Date(selectedBooking.startTime), selectedBooking.guestTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Video className="w-4 h-4 text-slate-400" />
                <span>{selectedBooking.eventType?.locationType || 'Google Meet'}</span>
              </div>
            </div>

            {selectedBooking.cancelToken && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <a href={`/api/public/bookings/${selectedBooking.cancelToken}/calendar`} target="_blank">
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download .ics
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
