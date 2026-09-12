'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, XCircle, RefreshCw, UserX, Copy } from 'lucide-react';

export function MeetingsTableActions({ booking }: { booking: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', cancellationReason: 'Cancelled by Host' }),
      });
      router.refresh();
    } catch {}
    setLoading(false);
    setOpen(false);
  };

  const handleMarkNoShow = async () => {
    setLoading(true);
    try {
      await fetch(`/api/bookings/${booking.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: 'NO_SHOW' }),
      });
      router.refresh();
    } catch {}
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 text-xs">
          {booking.status !== 'CANCELLED' && (
            <>
              <button
                onClick={handleMarkNoShow}
                disabled={loading}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Mark No-Show</span>
              </button>

              <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Meeting</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
