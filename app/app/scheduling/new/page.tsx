'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import {
  Calendar,
  Users,
  User,
  Clock,
  Video,
  Shield,
  Sliders,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function CreateEventTypePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

  // Step 1: Kind
  const [kind, setKind] = useState<'ONE_ON_ONE' | 'GROUP' | 'COLLECTIVE' | 'ROUND_ROBIN'>('ONE_ON_ONE');

  // Step 2: Basic Details
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);

  // Step 3: Location
  const [locationType, setLocationType] = useState('GOOGLE_MEET');
  const [locationInfo, setLocationInfo] = useState('');

  // Step 4: Availability Schedule
  const [scheduleChoice, setScheduleChoice] = useState('DEFAULT');

  // Step 5: Booking Limits
  const [minimumNotice, setMinimumNotice] = useState(120);
  const [maximumBookingWindow, setMaximumBookingWindow] = useState(60);
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [dailyMeetingLimit, setDailyMeetingLimit] = useState<number | ''>('');

  // Step 6: Invitee Questions
  const [questions, setQuestions] = useState<
    Array<{ id: string; label: string; type: string; required: boolean; options: string[] }>
  >([
    { id: 'q1', label: 'Name', type: 'SHORT_TEXT', required: true, options: [] },
    { id: 'q2', label: 'Email Address', type: 'SHORT_TEXT', required: true, options: [] },
  ]);

  // Step 7: Confirmation
  const [confirmationMessage, setConfirmationMessage] = useState('Thank you for scheduling with us! We look forward to meeting with you.');
  const [cancellationPolicy, setCancellationPolicy] = useState('Please give at least 24 hours notice for cancellations.');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}`,
        label: 'New Question',
        type: 'SHORT_TEXT',
        required: false,
        options: [],
      },
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          description,
          duration: Number(duration),
          kind,
          eventKind: kind,
          locationType,
          locationInfo: locationInfo || (locationType === 'GOOGLE_MEET' ? 'Google Meet Video Call' : locationType),
          minimumNotice: Number(minimumNotice),
          maximumBookingWindow: Number(maximumBookingWindow),
          maximumBookingDays: Number(maximumBookingWindow),
          bufferBefore: Number(bufferBefore),
          bufferAfter: Number(bufferAfter),
          dailyMeetingLimit: dailyMeetingLimit ? Number(dailyMeetingLimit) : null,
          confirmationMessage,
          cancellationPolicy,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create event type.');
        setLoading(false);
        return;
      }

      router.push('/app/scheduling');
      router.refresh();
    } catch {
      setErrorMsg('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create New Event Type</h1>
          <p className="text-xs text-slate-500">Configure multi-step scheduling settings for your invitees.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/scheduling')}>
          Cancel
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Step {step} of 8</span>
          <span>{Math.round((step / 8) * 100)}% Completed</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      <Card className="p-8">
        {/* STEP 1: KIND */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Choose Event Kind</h2>
              <p className="text-xs text-slate-500">Select how participants will join this meeting.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setKind('ONE_ON_ONE')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  kind === 'ONE_ON_ONE'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <User className="w-6 h-6 text-brand-600 mb-2" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">One-on-One</div>
                <div className="text-xs text-slate-500 mt-1">1 host and 1 invitee. Great for 1:1 consultation calls.</div>
              </div>

              <div
                onClick={() => setKind('GROUP')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  kind === 'GROUP'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <Users className="w-6 h-6 text-indigo-600 mb-2" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">Group Meeting</div>
                <div className="text-xs text-slate-500 mt-1">1 host and multiple invitees. Great for webinars & group training.</div>
              </div>

              <div
                onClick={() => setKind('COLLECTIVE')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  kind === 'COLLECTIVE'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <Users className="w-6 h-6 text-emerald-600 mb-2" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">Collective Team</div>
                <div className="text-xs text-slate-500 mt-1">Host with multiple team members. All hosts must be available.</div>
              </div>

              <div
                onClick={() => setKind('ROUND_ROBIN')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  kind === 'ROUND_ROBIN'
                    ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <Sliders className="w-6 h-6 text-amber-600 mb-2" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">Round Robin</div>
                <div className="text-xs text-slate-500 mt-1">Distribute meetings automatically across team members.</div>
              </div>
            </div>

            <Button variant="primary" className="w-full py-3" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue to Basic Details
            </Button>
          </div>
        )}

        {/* STEP 2: BASIC DETAILS */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Details</h2>
              <p className="text-xs text-slate-500">Specify event name, slug, description, and call duration.</p>
            </div>

            <Input
              label="Event Name *"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
              }}
              placeholder="e.g. 30 Minute Strategy Session"
              required
            />

            <Input
              label="URL Slug *"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="30min-strategy"
              helperText={`Booking URL: meetlio.com/username/${slug || 'slug'}`}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what will be discussed during this session..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (Minutes)</label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      duration === d
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d} Mins
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  if (!name.trim()) {
                    setErrorMsg('Please enter an event name.');
                    return;
                  }
                  setErrorMsg('');
                  setStep(3);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Location / Conferencing</h2>
              <p className="text-xs text-slate-500">Choose how the meeting will take place.</p>
            </div>

            <Select
              label="Location Type"
              options={[
                { label: 'Google Meet (Auto-generated video link)', value: 'GOOGLE_MEET' },
                { label: 'Zoom Meeting', value: 'ZOOM' },
                { label: 'Microsoft Teams', value: 'TEAMS' },
                { label: 'Phone Call (Host calls invitee)', value: 'PHONE' },
                { label: 'In-Person Meeting (Physical address)', value: 'IN_PERSON' },
                { label: 'Custom Link', value: 'CUSTOM' },
              ]}
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
            />

            {(locationType === 'IN_PERSON' || locationType === 'CUSTOM' || locationType === 'PHONE') && (
              <Input
                label="Location Details / Link / Phone"
                value={locationInfo}
                onChange={(e) => setLocationInfo(e.target.value)}
                placeholder="Address or call-in phone number..."
              />
            )}

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue to Availability
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: AVAILABILITY */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Availability Schedule</h2>
              <p className="text-xs text-slate-500">Select which schedule applies to this event type.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Default Working Hours</div>
                <div className="text-[11px] text-slate-500">Monday - Friday (09:00 - 17:00)</div>
              </div>
              <Check className="w-5 h-5 text-brand-600" />
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(5)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue to Limits
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: BOOKING LIMITS */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Booking Limits & Buffers</h2>
              <p className="text-xs text-slate-500">Prevent last-minute bookings and overbooking.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Notice (Minutes)"
                type="number"
                value={minimumNotice}
                onChange={(e) => setMinimumNotice(Number(e.target.value))}
                helperText="Notice required before call starts"
              />
              <Input
                label="Max Booking Window (Days ahead)"
                type="number"
                value={maximumBookingWindow}
                onChange={(e) => setMaximumBookingWindow(Number(e.target.value))}
                helperText="How far into the future invitees can book"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Buffer Before Call (Minutes)"
                type="number"
                value={bufferBefore}
                onChange={(e) => setBufferBefore(Number(e.target.value))}
              />
              <Input
                label="Buffer After Call (Minutes)"
                type="number"
                value={bufferAfter}
                onChange={(e) => setBufferAfter(Number(e.target.value))}
              />
            </div>

            <Input
              label="Daily Meeting Limit (Optional)"
              type="number"
              value={dailyMeetingLimit}
              onChange={(e) => setDailyMeetingLimit(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 5"
              helperText="Maximum bookings allowed per calendar day"
            />

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(4)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(6)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue to Invitee Form
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: INVITEE QUESTIONS */}
        {step === 6 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invitee Questions</h2>
                <p className="text-xs text-slate-500">Collect required details during booking.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddQuestion} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={q.label}
                      onChange={(e) => {
                        const next = [...questions];
                        next[idx].label = e.target.value;
                        setQuestions(next);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx].required = e.target.checked;
                          setQuestions(next);
                        }}
                      />
                      Required
                    </label>

                    {questions.length > 2 && (
                      <button onClick={() => handleRemoveQuestion(q.id)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(5)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(7)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue to Confirmation
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: CONFIRMATION & POLICY */}
        {step === 7 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirmation & Policy</h2>
              <p className="text-xs text-slate-500">Set the post-booking message and cancellation instructions.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirmation Message</label>
              <textarea
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none h-20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cancellation Policy</label>
              <textarea
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none h-20"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(6)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(8)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Review Event Type
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW & PUBLISH */}
        {step === 8 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review & Publish Event</h2>
              <p className="text-xs text-slate-500">Confirm all event configurations before saving to Meetlio.</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div><strong>Name:</strong> {name}</div>
              <div><strong>Slug:</strong> /{slug}</div>
              <div><strong>Duration:</strong> {duration} minutes</div>
              <div><strong>Kind:</strong> {kind}</div>
              <div><strong>Location:</strong> {locationType}</div>
              <div><strong>Min Notice:</strong> {minimumNotice} mins</div>
              <div><strong>Booking Window:</strong> {maximumBookingWindow} days</div>
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="outline" onClick={() => setStep(7)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-brand-600 hover:bg-brand-700 py-3 font-bold"
                onClick={handleSubmit}
                isLoading={loading}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Publish Event Type
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
