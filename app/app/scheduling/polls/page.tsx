'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function MeetingPollsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);

  const [options, setOptions] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '2026-09-01T10:00', endTime: '2026-09-01T10:30' },
    { startTime: '2026-09-01T14:00', endTime: '2026-09-01T14:30' },
  ]);

  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, { startTime: '2026-09-02T10:00', endTime: '2026-09-02T10:30' }]);
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration,
          options,
        }),
      });

      if (res.ok) {
        router.push('/app/scheduling?tab=polls');
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-600" /> Create Meeting Poll
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Propose candidate dates/times and allow participants to vote on the best time slot.
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Poll Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q4 Strategy Planning Session"
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide agenda or voting instructions..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none h-20"
            />
          </div>

          {/* Options list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Candidate Slots</label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddOption} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Option
              </Button>
            </div>

            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={opt.startTime}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx].startTime = e.target.value;
                    setOptions(next);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                />
                {options.length > 1 && (
                  <button type="button" onClick={() => handleRemoveOption(idx)} className="p-1.5 text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" variant="primary" isLoading={loading} className="w-full bg-brand-600 hover:bg-brand-700 py-3">
            Publish Poll & Generate Voting Link
          </Button>
        </form>
      </Card>
    </div>
  );
}
