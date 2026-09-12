'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Calendar as CalendarIcon, Check } from 'lucide-react';

export function DateOverridesManager({ initialOverrides, userId }: { initialOverrides: any[]; userId: string }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [targetDate, setTargetDate] = useState('');
  const [overrideType, setOverrideType] = useState<'UNAVAILABLE' | 'AVAILABLE'>('UNAVAILABLE');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;
    setLoading(true);

    try {
      const res = await fetch('/api/availability/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          type: overrideType,
          startTime: overrideType === 'AVAILABLE' ? startTime : null,
          endTime: overrideType === 'AVAILABLE' ? endTime : null,
        }),
      });

      if (res.ok) {
        setTargetDate('');
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      await fetch(`/api/availability/overrides/${id}`, { method: 'DELETE' });
      setOverrides((prev) => prev.filter((o) => o.id !== id));
      router.refresh();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddOverride} className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-xs font-bold text-slate-900 dark:text-white">Add Date Override</div>

        <Input
          type="date"
          label="Select Date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
        />

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Type</label>
          <select
            value={overrideType}
            onChange={(e: any) => setOverrideType(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="UNAVAILABLE">Unavailable (Holiday / Day Off)</option>
            <option value="AVAILABLE">Available (Custom Hours)</option>
          </select>
        </div>

        {overrideType === 'AVAILABLE' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
        )}

        <Button type="submit" variant="primary" size="sm" isLoading={loading} className="w-full" leftIcon={<Plus className="w-4 h-4" />}>
          Add Override Date
        </Button>
      </form>

      {/* Existing Overrides List */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Overrides</div>
        {overrides.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No specific date overrides added yet.</p>
        ) : (
          overrides.map((ov) => (
            <div key={ov.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {new Date(ov.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-slate-400">
                  {ov.type === 'UNAVAILABLE' ? '❌ Full Day Unavailable' : `✅ Custom (${ov.startTime} - ${ov.endTime})`}
                </div>
              </div>

              <button onClick={() => handleDeleteOverride(ov.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
