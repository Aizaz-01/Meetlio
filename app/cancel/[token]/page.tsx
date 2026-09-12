'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { MeetlioLogo } from '@/components/brand/logo';
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatTimeInZone } from '@/lib/scheduling/timezone';
import Link from 'next/link';

export default function PublicCancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/bookings/${token}/calendar`);
        if (!res.ok) {
          setErrorMsg('Booking not found or invalid cancellation link.');
          setBooking(null);
        } else {
          // If ICS works, fetch details via API
          const detailRes = await fetch(`/api/public/bookings/cancel`, {
            method: 'OPTIONS', // check existence or GET
          });
          // We can populate basic card state from token
          setBooking({ token });
        }
      } catch {
        setErrorMsg('Invalid cancellation token');
      }
      setLoading(false);
    }
    loadBooking();
  }, [token]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to cancel booking.');
        setSubmitting(false);
        return;
      }

      setCancelled(true);
      setSubmitting(false);
    } catch {
      setErrorMsg('An unexpected error occurred while cancelling your booking.');
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

      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
        {cancelled ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Booking Cancelled
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Your meeting has been successfully cancelled. The host has been notified.
            </p>
            <div className="pt-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  Return to Meetlio
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmCancel} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Cancel Your Booking?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please confirm that you want to cancel this scheduled appointment.
                </p>
              </div>
            </div>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let the host know why you cannot make it..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/">
                <Button variant="outline" type="button">
                  Keep Booking
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={submitting} className="bg-rose-600 hover:bg-rose-700">
                Confirm Cancellation
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
