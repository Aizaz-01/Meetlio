'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Plus, Trash2, Globe, Check, Copy, Edit2, Star } from 'lucide-react';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface AvailabilityWindowItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleRecord {
  id: string;
  name: string;
  isDefault: boolean;
  timeZone: string;
  availabilities: AvailabilityWindowItem[];
}

export function AvailabilityGrid() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [timezone, setTimezone] = useState('UTC');
  const [schedule, setSchedule] = useState<AvailabilityWindowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modals state
  const [createSchedModalOpen, setCreateSchedModalOpen] = useState(false);
  const [newSchedName, setNewSchedName] = useState('');
  const [newSchedIsDefault, setNewSchedIsDefault] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<number>(1);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([2, 3, 4, 5]);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/availability/schedules');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSchedules(data.data);
        const active = data.data.find((s: ScheduleRecord) => s.id === selectedScheduleId) || data.data[0];
        if (active) {
          setSelectedScheduleId(active.id);
          setTimezone(active.timeZone || 'UTC');
          setSchedule(active.availabilities || []);
        }
      }
    } catch {
      setErrorMsg('Failed to load availability schedules');
    }
    setLoading(false);
  }, [selectedScheduleId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSelectSchedule = (schedId: string) => {
    setSelectedScheduleId(schedId);
    const target = schedules.find((s) => s.id === schedId);
    if (target) {
      setTimezone(target.timeZone || 'UTC');
      setSchedule(target.availabilities || []);
    }
  };

  const handleCreateScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedName.trim()) return;

    try {
      const res = await fetch('/api/availability/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSchedName.trim(),
          isDefault: newSchedIsDefault,
          timeZone: timezone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast(`Schedule "${newSchedName}" created successfully!`);
        setCreateSchedModalOpen(false);
        setNewSchedName('');
        setNewSchedIsDefault(false);
        setSelectedScheduleId(data.data.id);
        fetchSchedules();
      } else {
        setErrorMsg(data.error || 'Failed to create schedule');
      }
    } catch {
      setErrorMsg('Failed to create schedule');
    }
  };

  const handleSetDefault = async (schedId: string) => {
    try {
      const res = await fetch('/api/availability/schedules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schedId, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Default availability schedule updated');
        fetchSchedules();
      }
    } catch {}
  };

  const handleDeleteSchedule = async (schedId: string) => {
    try {
      const res = await fetch(`/api/availability/schedules?id=${schedId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Schedule deleted successfully');
        setSelectedScheduleId('');
        fetchSchedules();
      } else {
        setErrorMsg(data.error || 'Failed to delete schedule');
      }
    } catch {
      setErrorMsg('Failed to delete schedule');
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    setSchedule((prev) => {
      const dayWindows = prev.filter((w) => w.dayOfWeek === dayIndex);
      if (dayWindows.length > 0) {
        const anyActive = dayWindows.some((w) => w.isActive);
        return prev.map((w) => (w.dayOfWeek === dayIndex ? { ...w, isActive: !anyActive } : w));
      } else {
        return [
          ...prev,
          {
            dayOfWeek: dayIndex,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          },
        ];
      }
    });
  };

  const handleAddWindow = (dayIndex: number) => {
    setSchedule((prev) => [
      ...prev,
      {
        dayOfWeek: dayIndex,
        startTime: '13:00',
        endTime: '17:00',
        isActive: true,
      },
    ]);
  };

  const handleRemoveWindow = (indexInSchedule: number) => {
    setSchedule((prev) => prev.filter((_, idx) => idx !== indexInSchedule));
  };

  const handleTimeChange = (indexInSchedule: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((w, idx) => (idx === indexInSchedule ? { ...w, [field]: value } : w))
    );
  };

  const handleCopyHours = () => {
    const sourceWindows = schedule.filter((w) => w.dayOfWeek === copySourceDay);
    if (sourceWindows.length === 0) return;

    setSchedule((prev) => {
      const cleaned = prev.filter((w) => !copyTargetDays.includes(w.dayOfWeek));
      const newlyAdded: AvailabilityWindowItem[] = [];
      for (const tDay of copyTargetDays) {
        for (const sWin of sourceWindows) {
          newlyAdded.push({
            dayOfWeek: tDay,
            startTime: sWin.startTime,
            endTime: sWin.endTime,
            isActive: sWin.isActive,
          });
        }
      }
      return [...cleaned, ...newlyAdded];
    });

    triggerToast(`Hours copied from ${DAYS_OF_WEEK[copySourceDay]} to selected days`);
    setCopyModalOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const activeWindows = schedule.filter((w) => w.isActive);
      for (const win of activeWindows) {
        await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: selectedScheduleId,
            dayOfWeek: win.dayOfWeek,
            startTime: win.startTime,
            endTime: win.endTime,
            isActive: true,
          }),
        });
      }

      triggerToast('Schedule saved successfully!');
      fetchSchedules();
    } catch {
      setErrorMsg('Failed to save schedule windows');
    }
    setSaving(false);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const currentScheduleObj = schedules.find((s) => s.id === selectedScheduleId);

  return (
    <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <Alert variant="success" className="shadow-xl bg-slate-900 text-white border-slate-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      {/* SCHEDULE SELECTOR HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Schedule
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedScheduleId}
              onChange={(e) => handleSelectSchedule(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>

            {currentScheduleObj && !currentScheduleObj.isDefault && (
              <button
                onClick={() => handleSetDefault(currentScheduleObj.id)}
                className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Set as Default Schedule"
              >
                <Star className="w-4 h-4" />
              </button>
            )}

            {currentScheduleObj && !currentScheduleObj.isDefault && (
              <button
                onClick={() => handleDeleteSchedule(currentScheduleObj.id)}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Delete Schedule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCopyModalOpen(true)}
            leftIcon={<Copy className="w-4 h-4" />}
          >
            Copy Hours to Days
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateSchedModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Schedule
          </Button>
        </div>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {/* Timezone Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Active Timezone</span>
        </div>
        <div className="w-full sm:w-72">
          <Select
            options={COMMON_TIMEZONES.map((tz) => ({ label: `${tz.label} (${tz.value})`, value: tz.value }))}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
      </div>

      {/* Days of Week List */}
      <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          const dayWindows = schedule.map((w, idx) => ({ ...w, originalIdx: idx })).filter((w) => w.dayOfWeek === dayIndex);
          const isDayActive = dayWindows.some((w) => w.isActive);

          return (
            <div key={dayName} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-3 w-36 shrink-0 pt-1">
                <input
                  type="checkbox"
                  id={`day-${dayIndex}`}
                  checked={isDayActive}
                  onChange={() => handleToggleDay(dayIndex)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor={`day-${dayIndex}`} className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                  {dayName}
                </label>
              </div>

              <div className="flex-1 space-y-2">
                {!isDayActive ? (
                  <div className="text-xs text-slate-400 italic pt-1">Unavailable</div>
                ) : (
                  dayWindows.map((win) => (
                    <div key={win.originalIdx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={win.startTime}
                        onChange={(e) => handleTimeChange(win.originalIdx, 'startTime', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <input
                        type="time"
                        value={win.endTime}
                        onChange={(e) => handleTimeChange(win.originalIdx, 'endTime', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => handleRemoveWindow(win.originalIdx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {isDayActive && (
                <button
                  onClick={() => handleAddWindow(dayIndex)}
                  className="p-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Interval
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Button variant="primary" onClick={handleSave} isLoading={saving}>
          Save Availability
        </Button>
      </div>

      {/* CREATE NEW SCHEDULE MODAL */}
      <Modal
        isOpen={createSchedModalOpen}
        onClose={() => setCreateSchedModalOpen(false)}
        title="Create New Availability Schedule"
      >
        <form onSubmit={handleCreateScheduleSubmit} className="space-y-4">
          <Input
            label="Schedule Name *"
            placeholder="e.g. Summer Working Hours, Custom Schedule"
            value={newSchedName}
            onChange={(e) => setNewSchedName(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="newDef"
              checked={newSchedIsDefault}
              onChange={(e) => setNewSchedIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600"
            />
            <label htmlFor="newDef" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Set as Default Schedule
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setCreateSchedModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* COPY HOURS MODAL */}
      <Modal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Copy Hours to Selected Days"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Copy Hours From</label>
            <select
              value={copySourceDay}
              onChange={(e) => setCopySourceDay(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold"
            >
              {DAYS_OF_WEEK.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300">Apply To Days</label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((d, i) => {
                if (i === copySourceDay) return null;
                const isSelected = copyTargetDays.includes(i);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCopyTargetDays((prev) => prev.filter((td) => td !== i));
                      } else {
                        setCopyTargetDays((prev) => [...prev, i]);
                      }
                    }}
                    className={`p-2 rounded-xl font-semibold border text-left flex items-center justify-between ${
                      isSelected ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-600' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{d}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setCopyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCopyHours}>
              Apply Copy
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
