'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import { MeetlioLogo } from '@/components/brand/logo';
import { Calendar, Clock, Globe, User, CheckCircle2, ArrowLeft } from 'lucide-react';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';
import { formatTimeInZone } from '@/lib/scheduling/timezone';
import Link from 'next/link';

export default function PublicReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [guestTimezone, setGuestTimezone] = useState('America/New_York');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [newBookingData, setNewBookingData] = useState<any>(null);

  // Load available slots
  const fetchSlots = useCallback(async (date: string, tz: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Find booking first to resolve host/event
      const calRes = await fetch(`/api/public/bookings/${token}/calendar`);
      if (!calRes.ok) {
        setErrorMsg('Invalid or expired reschedule link');
        setLoading(false);
        return;
      }
      // For general public reschedule, we hit availability
      const availRes = await fetch(`/api/public/alexsmith/30min/availability?date=${date}&tz=${encodeURIComponent(tz)}`);
      const availData = await availRes.json();
      if (availData.success && availData.data) {
        setAvailableSlots(availData.data.availableSlots || []);
      }
    } catch {
      setErrorMsg('Failed to load available time slots');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchSlots(selectedDate, guestTimezone);
  }, [selectedDate, guestTimezone, fetchSlots]);

  const handleConfirmReschedule = async () => {
    if (!selectedSlot) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newStartTime: selectedSlot,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setErrorMsg('This time slot is no longer available. Please select another slot.');
        fetchSlots(selectedDate, guestTimezone);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to reschedule booking.');
        setSubmitting(false);
        return;
      }

      setNewBookingData(data.data);
      setSubmitting(false);
    } catch {
      setErrorMsg('An unexpected error occurred while rescheduling.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="mb-6 text-center">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>
      </div>

      <Card className="w-full max-w-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        {newBookingData ? (
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Reschedule Complete
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Meeting Rescheduled!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Your appointment has been updated to the new date and time.
              </p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-3 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{newBookingData.eventTitle}</span>
                <span className="text-[11px] font-mono text-slate-400">ID: {newBookingData.id.substring(0, 10)}</span>
              </div>

              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{formatTimeInZone(new Date(newBookingData.startTime), newBookingData.guestTimezone || guestTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Host: {newBookingData.hostName}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Reschedule Your Appointment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select a new date and available time slot to reschedule your meeting.
              </p>
            </div>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date & Timezone selector */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Select New Date
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Your Timezone
                  </div>
                  <Select
                    options={COMMON_TIMEZONES}
                    value={guestTimezone}
                    onChange={(e) => setGuestTimezone(e.target.value)}
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Available Time Slots
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <TimeSlotPicker
                    slots={availableSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(dt) => setSelectedSlot(dt)}
                  />
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <Button
                  variant="primary"
                  onClick={handleConfirmReschedule}
                  isLoading={submitting}
                >
                  Confirm Reschedule
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
