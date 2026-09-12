'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Plus, Trash2, Check, Copy } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export function AvailabilityScheduleManager({ schedule, userId }: { schedule: any; userId: string }) {
  const router = useRouter();

  // Map initial availabilities into state dictionary
  const initialMap: Record<number, { active: boolean; slots: Array<{ startTime: string; endTime: string }> }> = {};
  DAYS_OF_WEEK.forEach((d) => {
    const existing = schedule.availabilities?.filter((a: any) => a.dayOfWeek === d.id && a.isActive);
    if (existing && existing.length > 0) {
      initialMap[d.id] = {
        active: true,
        slots: existing.map((e: any) => ({ startTime: e.startTime, endTime: e.endTime })),
      };
    } else {
      initialMap[d.id] = {
        active: false,
        slots: [{ startTime: '09:00', endTime: '17:00' }],
      };
    }
  });

  const [days, setDays] = useState(initialMap);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const toggleDay = (dayId: number) => {
    setDays((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        active: !prev[dayId].active,
      },
    }));
  };

  const updateSlot = (dayId: number, idx: number, field: 'startTime' | 'endTime', val: string) => {
    setDays((prev) => {
      const nextSlots = [...prev[dayId].slots];
      nextSlots[idx][field] = val;
      return {
        ...prev,
        [dayId]: { ...prev[dayId], slots: nextSlots },
      };
    });
  };

  const addSlot = (dayId: number) => {
    setDays((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: [...prev[dayId].slots, { startTime: '13:00', endTime: '17:00' }],
      },
    }));
  };

  const removeSlot = (dayId: number, idx: number) => {
    setDays((prev) => {
      const nextSlots = prev[dayId].slots.filter((_, i) => i !== idx);
      return {
        ...prev,
        [dayId]: { ...prev[dayId], slots: nextSlots.length ? nextSlots : [{ startTime: '09:00', endTime: '17:00' }] },
      };
    });
  };

  const handleCopyHoursToAll = () => {
    const mondayConfig = days[1];
    setDays((prev) => {
      const next = { ...prev };
      [1, 2, 3, 4, 5].forEach((d) => {
        next[d] = {
          active: mondayConfig.active,
          slots: mondayConfig.slots.map((s) => ({ ...s })),
        };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');

    try {
      const payload: any[] = [];
      Object.entries(days).forEach(([dayIdStr, data]) => {
        const dayOfWeek = parseInt(dayIdStr, 10);
        if (data.active) {
          data.slots.forEach((s) => {
            payload.push({ dayOfWeek, startTime: s.startTime, endTime: s.endTime });
          });
        }
      });

      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          availabilities: payload,
        }),
      });

      if (res.ok) {
        setMsg('Weekly schedule updated successfully!');
        router.refresh();
      } else {
        setMsg('Failed to update schedule.');
      }
    } catch {
      setMsg('Error saving availability.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {msg && <Alert variant={msg.includes('success') ? 'success' : 'error'}>{msg}</Alert>}

      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 font-medium">Configure active working hours per day:</span>
        <Button size="sm" variant="outline" onClick={handleCopyHoursToAll} leftIcon={<Copy className="w-3.5 h-3.5" />}>
          Copy Mon Hours to Weekdays
        </Button>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((d) => {
          const config = days[d.id];
          return (
            <div
              key={d.id}
              className={`p-4 rounded-2xl border transition-all ${
                config.active
                  ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-100/50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.active}
                    onChange={() => toggleDay(d.id)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white w-24">{d.name}</span>
                </label>

                {config.active ? (
                  <div className="flex-1 space-y-2">
                    {config.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(d.id, idx, 'startTime', e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs text-slate-400 font-bold">-</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(d.id, idx, 'endTime', e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        />

                        {config.slots.length > 1 && (
                          <button onClick={() => removeSlot(d.id, idx)} className="p-1 text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold italic">Unavailable</span>
                )}

                {config.active && (
                  <button
                    onClick={() => addSlot(d.id)}
                    className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Slot
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        onClick={handleSave}
        isLoading={saving}
        className="w-full bg-brand-600 hover:bg-brand-700 py-3 font-bold"
        leftIcon={<Check className="w-4 h-4" />}
      >
        Save Schedule Changes
      </Button>
    </div>
  );
}
