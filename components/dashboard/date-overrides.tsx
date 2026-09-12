'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Select } from '../ui/select';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Calendar, Clock, Check } from 'lucide-react';

export interface OverrideRecord {
  id: string;
  date: string;
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startTime?: string | null;
  endTime?: string | null;
}

export function DateOverridesManager() {
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState('');
  const [type, setType] = useState<'AVAILABLE' | 'UNAVAILABLE'>('UNAVAILABLE');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/availability/overrides');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOverrides(
          data.data.map((o: any) => ({
            id: o.id,
            date: typeof o.date === 'string' ? o.date.split('T')[0] : o.date,
            type: o.type,
            startTime: o.startTime,
            endTime: o.endTime,
          }))
        );
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const openAddModal = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setType('UNAVAILABLE');
    setStartTime('09:00');
    setEndTime('17:00');
    setFormError('');
    setModalOpen(true);
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/availability/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          type,
          startTime: type === 'AVAILABLE' ? startTime : undefined,
          endTime: type === 'AVAILABLE' ? endTime : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save date override');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setModalOpen(false);
      triggerToast('Date override saved successfully');
      fetchOverrides();
    } catch {
      setFormError('Failed to save date override');
      setSubmitting(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      const res = await fetch(`/api/availability/overrides/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOverrides((prev) => prev.filter((o) => o.id !== id));
        triggerToast('Date override removed');
      }
    } catch {}
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <Card className="p-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <Alert variant="success" className="shadow-xl bg-slate-900 text-white border-slate-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Date Overrides</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add specific dates when your availability differs from your weekly schedule (e.g. holidays or custom hours)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openAddModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Date Override
        </Button>
      </div>

      {loading ? (
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      ) : overrides.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No date overrides set</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Add specific dates to block out holidays or set custom working hours.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {overrides.map((override) => (
            <div key={override.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
                  {override.date}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={override.type === 'UNAVAILABLE' ? 'danger' : 'success'}>
                      {override.type === 'UNAVAILABLE' ? 'Unavailable' : 'Custom Hours'}
                    </Badge>
                    {override.type === 'AVAILABLE' && override.startTime && override.endTime && (
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {override.startTime} — {override.endTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteOverride(override.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Delete override"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Override Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Date Override"
        description="Select a date and specify whether you are unavailable or working custom hours."
        maxWidth="sm"
      >
        <form onSubmit={handleAddOverride} className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Select
            label="Availability Status *"
            options={[
              { value: 'UNAVAILABLE', label: 'Unavailable (Entire Day)' },
              { value: 'AVAILABLE', label: 'Custom Working Hours' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          />

          {type === 'AVAILABLE' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Save Override
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
