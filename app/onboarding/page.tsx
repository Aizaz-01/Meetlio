'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { MeetlioLogo } from '@/components/brand/logo';
import { COMMON_TIMEZONES, getUserDefaultTimezone } from '@/lib/timezone/options';
import { CheckCircle2, Globe, Calendar, Clock, ArrowRight, Check, Sparkles, Building2, User, Video, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  // Step 1: Profile & Handle
  const [name, setName] = useState('Alex Smith');
  const [username, setUsername] = useState('alexsmith');

  // Step 2: Use Case
  const [useCase, setUseCase] = useState('Sales');

  // Step 3: Timezone
  const [timezone, setTimezone] = useState(getUserDefaultTimezone());

  // Step 4: Calendar Integration
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);

  // Step 5: Working Hours
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Step 6: First Event Type
  const [eventName, setEventName] = useState('30 Minute Strategy Call');
  const [eventDuration, setEventDuration] = useState('30');
  const [locationType, setLocationType] = useState('GOOGLE_MEET');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const useCases = [
    { id: 'Sales', title: 'Sales & Business Dev', desc: 'Demos, discovery calls, and closing deals' },
    { id: 'Recruiting', title: 'Recruiting & HR', desc: 'Candidate interviews and screenings' },
    { id: 'Customer success', title: 'Customer Success', desc: 'Onboarding, training, and support' },
    { id: 'Education', title: 'Education & Coaching', desc: 'Office hours, mentoring, and tutoring' },
    { id: 'Personal', title: 'Personal & Freelance', desc: 'Client meetings and personal consulting' },
    { id: 'Other', title: 'Other Use Cases', desc: 'Custom scheduling workflows' },
  ];

  const handleFinishOnboarding = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // Create first event type and complete onboarding profile
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          useCase,
          timezone,
          startTime,
          endTime,
          calendarProvider: connectedProvider,
          firstEvent: {
            name: eventName,
            duration: parseInt(eventDuration, 10),
            locationType,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to complete onboarding');
        setLoading(false);
        return;
      }

      setStep(7); // Show success screen
    } catch {
      setErrorMsg('Failed to complete onboarding. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center justify-center">
      <div className="mb-8 flex items-center justify-between w-full max-w-xl">
        <MeetlioLogo className="h-8 text-slate-900 dark:text-white" />
        <span className="text-xs font-semibold text-slate-400">7-Step Onboarding</span>
      </div>

      <Card className="w-full max-w-xl p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl space-y-6">
        {/* Progress Bar & Stepper Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Step {step} of 7</span>
            <span>{Math.round((step / 7) * 100)}% Completed</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* STEP 1: WELCOME / PROFILE */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome to Meetlio 👋
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Let&apos;s set up your personal scheduling profile and booking handle.
              </p>
            </div>

            <Input
              label="Your Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Custom Booking Handle / URL *
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs">
                <span className="text-slate-400 font-mono">meetlio.com/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="flex-1 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none pl-1"
                  required
                />
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim() || !username.trim()) {
                  setErrorMsg('Please enter a name and booking handle.');
                  return;
                }
                setErrorMsg('');
                setStep(2);
              }}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2: CHOOSE USE CASE */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How do you plan to use Meetlio?
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                We&apos;ll tailor your event defaults and workflows accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {useCases.map((uc) => (
                <div
                  key={uc.id}
                  onClick={() => setUseCase(uc.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    useCase === uc.id
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-600 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{uc.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{uc.desc}</div>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              onClick={() => setStep(3)}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 3: TIMEZONE */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Confirm your primary timezone
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Meetlio auto-converts your availability to your invitees&apos; local timezones.
              </p>
            </div>

            <Select
              label="Primary Timezone"
              options={COMMON_TIMEZONES.map((tz) => ({ label: `${tz.label} (${tz.value})`, value: tz.value }))}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Globe className="w-5 h-5 text-brand-500 shrink-0" />
              <span>Current detected local timezone: <strong>{timezone}</strong></span>
            </div>

            <Button
              variant="primary"
              onClick={() => setStep(4)}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 4: CONNECT CALENDAR */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Connect your calendar
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Prevent double-bookings by checking external calendar busy times.
              </p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setConnectedProvider('GOOGLE')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedProvider === 'GOOGLE'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Google Calendar</div>
                    <div className="text-[11px] text-slate-400">Sync Gmail / Google Workspace (Development Mode)</div>
                  </div>
                </div>
                {connectedProvider === 'GOOGLE' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
              </div>

              <div
                onClick={() => setConnectedProvider('MICROSOFT')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  connectedProvider === 'MICROSOFT'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-xs">
                    M
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Microsoft Outlook / Office 365</div>
                    <div className="text-[11px] text-slate-400">Sync Outlook calendar (Development Mode)</div>
                  </div>
                </div>
                {connectedProvider === 'MICROSOFT' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => setStep(5)}
                className="w-full bg-brand-600 hover:bg-brand-700 py-3"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
              <button
                onClick={() => {
                  setConnectedProvider(null);
                  setStep(5);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 text-center py-1"
              >
                Skip calendar integration for now
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: WORKING HOURS */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Set your weekly working hours
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Define when invitees are allowed to book appointments with you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Monday - Friday ({startTime} to {endTime}) configured by default.</span>
            </div>

            <Button
              variant="primary"
              onClick={() => setStep(6)}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Create Event
            </Button>
          </div>
        )}

        {/* STEP 6: CREATE FIRST EVENT TYPE */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create your first event type
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Choose a meeting title, duration, and video conferencing location.
              </p>
            </div>

            <Input
              label="Event Name *"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. 30 Min Strategy Session"
              required
            />

            <Select
              label="Meeting Duration"
              options={[
                { label: '15 minutes', value: '15' },
                { label: '30 minutes', value: '30' },
                { label: '45 minutes', value: '45' },
                { label: '60 minutes', value: '60' },
              ]}
              value={eventDuration}
              onChange={(e) => setEventDuration(e.target.value)}
            />

            <Select
              label="Location / Video Conference"
              options={[
                { label: 'Google Meet Video Call', value: 'GOOGLE_MEET' },
                { label: 'Zoom Meeting', value: 'ZOOM' },
                { label: 'Microsoft Teams', value: 'TEAMS' },
                { label: 'Phone Call', value: 'PHONE' },
                { label: 'In-Person Meeting', value: 'IN_PERSON' },
              ]}
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
            />

            <Button
              variant="primary"
              onClick={handleFinishOnboarding}
              isLoading={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3"
              rightIcon={<Sparkles className="w-4 h-4" />}
            >
              Complete Setup & Generate Event
            </Button>
          </div>
        )}

        {/* STEP 7: SUCCESS CONFIRMATION */}
        {step === 7 && (
          <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                You&apos;re all set, {name}! 🎉
              </h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your Meetlio account is initialized. Your first event type <strong>&quot;{eventName}&quot;</strong> is live at:
              </p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs text-brand-600 dark:text-brand-400 font-bold inline-block border border-slate-200 dark:border-slate-700">
                https://meetlio.com/{username}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => router.push('/app/scheduling')}
              className="w-full bg-brand-600 hover:bg-brand-700 py-3 text-sm font-bold"
            >
              Go to Meetlio Workspace Dashboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
