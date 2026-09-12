'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Zap, Plus, X } from 'lucide-react';

export function CreateWorkflowModal({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('24h Meeting Reminder');
  const [trigger, setTrigger] = useState('booking.created');
  const [actionType, setActionType] = useState('EMAIL');
  const [timing, setTiming] = useState('BEFORE_MEETING');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trigger,
          actions: [
            {
              actionType,
              type: 'SEND_EMAIL',
              timing,
              order: 0,
            },
          ],
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
        Create Workflow
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Automated Workflow</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Workflow Name *" value={name} onChange={(e) => setName(e.target.value)} required />

              <Select
                label="Trigger Event *"
                options={[
                  { label: 'When a new booking is created', value: 'booking.created' },
                  { label: '24 hours before meeting starts', value: 'before.meeting' },
                  { label: '1 hour after meeting ends', value: 'after.meeting' },
                  { label: 'When a booking is cancelled', value: 'booking.cancelled' },
                  { label: 'When attendee marks no-show', value: 'meeting.no_show' },
                ]}
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              />

              <Select
                label="Action Type *"
                options={[
                  { label: 'Send Email Notification', value: 'EMAIL' },
                  { label: 'Send SMS Reminder', value: 'SMS' },
                  { label: 'Trigger Webhook Endpoint', value: 'WEBHOOK' },
                  { label: 'Create Internal Notification', value: 'INTERNAL_NOTIFICATION' },
                ]}
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              />

              <Select
                label="Timing *"
                options={[
                  { label: 'Execute Immediately', value: 'IMMEDIATE' },
                  { label: 'Before Meeting Starts', value: 'BEFORE_MEETING' },
                  { label: 'After Meeting Ends', value: 'AFTER_MEETING' },
                ]}
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                  Save Workflow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
