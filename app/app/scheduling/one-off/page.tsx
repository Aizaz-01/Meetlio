'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyButton } from '@/components/ui/copy-button';
import { Clock, Plus, Sparkles, CheckCircle2, Link as LinkIcon } from 'lucide-react';

export default function OneOffMeetingsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Quick Sync Meeting');
  const [duration, setDuration] = useState(30);
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          slug: `one-off-${Date.now()}`,
          duration: Number(duration),
          kind: 'ONE_OFF',
          eventKind: 'ONE_OFF',
          locationType: 'GOOGLE_MEET',
          isPrivate: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const appUrl = window.location.origin;
        setGeneratedLink(`${appUrl}/${data.event.user?.username || 'me'}/${data.event.slug}`);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-brand-600" /> One-Off Meeting Link Generator
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate temporary single-use links that automatically deactivate once an invitee books.
        </p>
      </div>

      <Card className="p-8 space-y-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <Input
            label="Meeting Name *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (Minutes)</label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
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

          <Button type="submit" variant="primary" isLoading={loading} className="w-full bg-brand-600 hover:bg-brand-700 py-3">
            Generate Single-Use Link
          </Button>
        </form>

        {generatedLink && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Single-Use Link Active
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl font-mono text-xs text-brand-600 dark:text-brand-400 font-bold truncate flex items-center justify-between border">
              <span className="truncate">{generatedLink}</span>
              <CopyButton value={generatedLink} className="ml-2" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
