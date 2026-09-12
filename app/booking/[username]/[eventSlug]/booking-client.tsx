/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { MeetlioLogo } from '@/components/brand/logo';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';
import {
  Clock,
  Video,
  Globe,
  Calendar as CalendarIcon,
  ArrowRight,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface PublicBookingClientProps {
  host: {
    id: string;
    name: string;
    username: string;
    timezone: string;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  eventType: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    duration: number;
    locationType: string;
    questions?: Array<{
      id: string;
      label: string;
      type: string;
      options: string[];
      isRequired: boolean;
    }>;
  };
}

// Helper to format Date to YYYY-MM-DD in local time
function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function PublicBookingClient({ host, eventType }: PublicBookingClientProps) {
  const router = useRouter();

  // State
  const [guestTimezone, setGuestTimezone] = useState(host.timezone || 'UTC');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Mobile Stepper State (Step 1: Date & Time, Step 2: Guest Form)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Form input states
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [invitees, setInvitees] = useState<string[]>([]);
  const [inviteeInput, setInviteeInput] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default selected date to today
  useEffect(() => {
    const today = new Date();
    setSelectedDate(formatLocalDate(today));
  }, []);

  // Fetch slots on date or timezone change
  useEffect(() => {
    if (!selectedDate) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(
          `/api/public/${host.username}/${eventType.slug}/availability?date=${selectedDate}&timezone=${guestTimezone}`
        );
        const data = await res.json();
        if (data.success) {
          const slots = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.availableSlots)
            ? data.availableSlots
            : Array.isArray(data.data?.availableSlots)
            ? data.data.availableSlots
            : [];
          setAvailableSlots(slots);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setAvailableSlots([]);
      }
      setSlotsLoading(false);
    }
    fetchSlots();
  }, [selectedDate, guestTimezone, host.username, eventType.slug]);

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select a time slot to continue');
      return;
    }

    setBookingLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/public/${host.username}/${eventType.slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: selectedSlot.startTime || selectedSlot.datetime,
          slotStartTime: selectedSlot.startTime || selectedSlot.datetime,
          slotEndTime: selectedSlot.endTime,
          targetDate: selectedDate,
          guestName,
          guestEmail,
          guestPhone,
          guestTimezone,
          invitees,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error?.message || data.error || 'Failed to complete booking');
        setBookingLoading(false);
        return;
      }

      // Redirect to confirmation page with token and bookingId
      const cancelToken = data.data?.cancelToken || '';
      const bookingId = data.data?.id || '';
      router.push(`/booking/${host.username}/${eventType.slug}/confirmation?token=${cancelToken}&bookingId=${bookingId}`);
    } catch {
      setErrorMsg('An unexpected error occurred during booking. Please try again.');
      setBookingLoading(false);
    }
  };

  // CALENDLY-STYLE MONTH CALENDAR HELPERS
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const todayStr = formatLocalDate(new Date());

  const renderCalendarDays = () => {
    const cells = [];

    // Empty lead cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = formatLocalDate(dateObj);

      const isPast = dateStr < todayStr;
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === todayStr;

      cells.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => {
            setSelectedDate(dateStr);
            setSelectedSlot(null);
            if (mobileStep === 1) setMobileStep(2);
          }}
          className={`h-10 w-10 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-semibold transition-all relative ${
            isSelected
              ? 'bg-brand-600 text-white shadow-md font-bold ring-2 ring-brand-400 ring-offset-2'
              : isPast
              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
              : 'text-slate-800 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 hover:text-brand-600 font-medium'
          }`}
        >
          <span>{d}</span>
          {isToday && !isSelected && (
            <span className="w-1 h-1 bg-brand-600 rounded-full absolute bottom-1" />
          )}
        </button>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center justify-start overflow-y-auto">
      {/* Top Header Logo */}
      <div className="mb-6 shrink-0">
        <Link href="/">
          <MeetlioLogo className="h-7 text-slate-900 dark:text-white" />
        </Link>
      </div>

      {/* Main 3-Column Container */}
      <Card className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 my-auto">
        
        {/* COLUMN 1: Host Info & Event Summary */}
        <div className="lg:col-span-4 p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between space-y-6 max-h-[85vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Host Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-base shadow-sm shrink-0">
                {host.avatarUrl ? (
                  <img src={host.avatarUrl} alt={host.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  host.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{host.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">@{host.username}</p>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {eventType.name}
              </h1>
              {eventType.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {eventType.description}
                </p>
              )}
            </div>

            {/* Event Details */}
            <div className="space-y-3 pt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{eventType.duration} Minutes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{eventType.locationType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{guestTimezone}</span>
              </div>
            </div>

            {/* Selected Slot Confirmation Badge */}
            {selectedSlot && (
              <div className="p-3.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                <div className="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                  Selected Time
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                  {slotTimeLabel(selectedSlot)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-4">
            Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Meetlio</span>
          </div>
        </div>

        {/* MOBILE STEPPER HEADER */}
        <div className="lg:hidden p-4 bg-slate-100 dark:bg-slate-800 border-b flex items-center justify-between text-xs font-bold">
          <button
            disabled={mobileStep === 1}
            onClick={() => setMobileStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
            className={`flex items-center gap-1 ${mobileStep > 1 ? 'text-brand-600' : 'text-slate-400 cursor-not-allowed'}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span>
            Step {mobileStep} of 3: {mobileStep === 1 ? 'Date' : mobileStep === 2 ? 'Time Slot' : 'Your Info'}
          </span>
        </div>

        {/* COLUMN 2: Calendly Monthly Interactive Calendar */}
        <div className={`lg:col-span-4 p-6 space-y-6 max-h-[85vh] overflow-y-auto ${mobileStep !== 1 ? 'hidden lg:block' : ''}`}>
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Select a Date
            </h2>
            <p className="text-xs text-slate-400">Choose an available day for your meeting</p>
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {monthName}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Column Days Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {renderCalendarDays()}
          </div>

          {/* Timezone Select */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Timezone
            </label>
            <Select
              options={COMMON_TIMEZONES.map((tz) => ({ label: `${tz.label} (${tz.value})`, value: tz.value }))}
              value={guestTimezone}
              onChange={(e) => setGuestTimezone(e.target.value)}
            />
          </div>
        </div>

        {/* COLUMN 3: Available Time Slots & Guest Booking Form */}
        <div className={`lg:col-span-4 p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto ${mobileStep === 1 ? 'hidden lg:block' : ''}`}>
          {/* Sub-step A: Time Slots Picker */}
          {!selectedSlot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Available Slots
                  </h2>
                  <p className="text-xs text-slate-400">
                    {new Date((selectedDate || todayStr) + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {slotsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                  No available time slots on this date. Please choose another date on the calendar.
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {availableSlots.map((slot, idx) => {
                    const label = slot.time || slotTimeLabel(slot);
                    return (
                      <button
                        key={slot.startTime || slot.datetime || idx}
                        type="button"
                        disabled={slot.available === false}
                        onClick={() => {
                          if (slot.available === false) return;
                          setSelectedSlot(slot);
                          if (mobileStep === 2) setMobileStep(3);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between group shadow-sm ${
                          slot.available === false
                            ? 'opacity-40 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                            : 'border-brand-200 dark:border-brand-900 hover:bg-brand-600 hover:text-white hover:border-brand-600 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        <span>{label}</span>
                        {slot.available !== false && (
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Sub-step B: Guest Details & Dynamic Questions Form */
            <form onSubmit={handleBookingSubmit} className="space-y-4 animate-in fade-in pb-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Enter Details
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  Change Slot
                </button>
              </div>

              {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

              <Input
                label="Your Name *"
                placeholder="Jane Doe"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Your Email *"
                type="email"
                placeholder="jane@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              {/* Additional Invitees Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Additional Guests / Invitees (Optional)
                </label>
                {invitees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {invitees.map((email, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full text-xs font-semibold"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => setInvitees(invitees.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 text-slate-400 ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="colleague@example.com"
                    type="email"
                    value={inviteeInput}
                    onChange={(e) => setInviteeInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (inviteeInput.trim() && inviteeInput.includes('@') && !invitees.includes(inviteeInput.trim())) {
                        setInvitees([...invitees, inviteeInput.trim().toLowerCase()]);
                        setInviteeInput('');
                      }
                    }}
                  >
                    + Add Guest
                  </Button>
                </div>
              </div>

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />

              {/* Dynamic Questions */}
              {eventType.questions && eventType.questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  {eventType.questions.map((q) => (
                    <div key={q.id} className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {q.label} {q.isRequired && <span className="text-rose-500">*</span>}
                      </label>
                      {q.type === 'LONG_TEXT' ? (
                        <textarea
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          required={q.isRequired}
                        />
                      ) : q.type === 'SINGLE_SELECT' ? (
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          required={q.isRequired}
                        >
                          <option value="">Select an option</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          placeholder="Your answer"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          required={q.isRequired}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 py-3 text-xs font-extrabold rounded-2xl shadow-lg mt-4"
                isLoading={bookingLoading}
              >
                Schedule Event
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

function slotTimeLabel(slot: any): string {
  if (!slot) return '';
  if (slot.time) return slot.time;
  const start = slot.startTime || slot.datetime;
  if (!start) return '';
  const startDate = new Date(start);
  return startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
