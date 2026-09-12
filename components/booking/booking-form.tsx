'use client';

import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';
import { Calendar, Clock, User, Mail, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Alert } from '../ui/alert';
import { formatTimeInZone } from '@/lib/scheduling/timezone';

export interface BookingFormProps {
  username: string;
  eventSlug: string;
  eventTitle: string;
  duration: number;
  hostName: string;
  selectedDatetime: string;
  onBack: () => void;
  onRefreshSlots?: () => void;
}

export function BookingForm({
  username,
  eventSlug,
  eventTitle,
  duration,
  hostName,
  selectedDatetime,
  onBack,
  onRefreshSlots,
}: BookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guestTimezone, setGuestTimezone] = useState('America/New_York');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConflict, setIsConflict] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  const parsedStartDate = new Date(selectedDatetime);
  const formattedSlotTime = formatTimeInZone(parsedStartDate, guestTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsConflict(false);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/public/${username}/${eventSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name,
          guestEmail: email,
          guestTimezone,
          startTime: selectedDatetime,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setIsConflict(true);
        setErrorMsg('This time was just booked. Please select another available time.');
        if (onRefreshSlots) onRefreshSlots();
        setIsLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to complete booking. Please try again.');
        setIsLoading(false);
        return;
      }

      setConfirmationData(data.data);
      setIsLoading(false);
    } catch {
      setErrorMsg('An unexpected error occurred while booking. Please try again.');
      setIsLoading(false);
    }
  };

  if (confirmationData) {
    const confirmationDate = new Date(confirmationData.startTime);
    const displayGuestTime = formatTimeInZone(
      confirmationDate,
      confirmationData.guestTimezone || guestTimezone,
      'EEEE, MMMM d, yyyy @ hh:mm a'
    );

    return (
      <div className="p-8 text-center animate-in zoom-in-95 space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Booking Confirmed
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            You&apos;re booked!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Your meeting has been successfully scheduled. A confirmation summary has been registered for{' '}
            <strong className="text-slate-900 dark:text-white">{confirmationData.guestEmail}</strong>.
          </p>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-3 max-w-md mx-auto shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{confirmationData.eventTitle}</span>
            <span className="text-[11px] font-mono text-slate-400">ID: {confirmationData.id.substring(0, 10)}</span>
          </div>

          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{displayGuestTime}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand-500 shrink-0" />
              <span>{confirmationData.duration} Minutes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Host: {confirmationData.hostName}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-500 shrink-0" />
              <span>Guest: {confirmationData.guestName} ({confirmationData.guestEmail})</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Schedule Another Meeting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to time slots</span>
      </button>

      {errorMsg && (
        <Alert variant={isConflict ? 'error' : 'error'} className="mb-2">
          <div className="flex flex-col gap-2">
            <span>{errorMsg}</span>
            {isConflict && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onBack}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="w-fit"
              >
                Select Another Slot
              </Button>
            )}
          </div>
        </Alert>
      )}

      <Alert variant="info">
        Selected slot: <strong>{formattedSlotTime}</strong>
      </Alert>

      <Input
        label="Your Full Name *"
        placeholder="e.g. Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        leftIcon={<User className="w-4 h-4" />}
      />

      <Input
        label="Your Email Address *"
        type="email"
        placeholder="jane@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        leftIcon={<Mail className="w-4 h-4" />}
      />

      <Select
        label="Your Timezone *"
        options={COMMON_TIMEZONES}
        value={guestTimezone}
        onChange={(e) => setGuestTimezone(e.target.value)}
      />

      <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
        Confirm Booking
      </Button>
    </form>
  );
}
