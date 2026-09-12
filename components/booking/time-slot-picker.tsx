'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Clock } from 'lucide-react';

export interface TimeSlotPickerProps {
  slots: { time: string; datetime: string; available: boolean }[];
  selectedSlot: string | null;
  onSelectSlot: (datetime: string) => void;
  onConfirmSlot?: (datetime: string) => void;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelectSlot, onConfirmSlot }: TimeSlotPickerProps) {
  if (!slots || slots.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
        No available time slots on this date. Please pick another date.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        Select Time
      </div>
      {slots.map((s, idx) => {
        const isSelected = selectedSlot === s.datetime;
        return (
          <div key={idx} className="flex gap-2">
            <button
              disabled={!s.available}
              onClick={() => onSelectSlot(s.datetime)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:border-brand-500 dark:text-brand-300'
                  : s.available
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600'
                  : 'border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/50 text-slate-300 dark:text-slate-700 cursor-not-allowed'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{s.time}</span>
            </button>
            {isSelected && onConfirmSlot && (
              <Button
                variant="primary"
                size="sm"
                className="animate-in fade-in zoom-in-95"
                onClick={() => onConfirmSlot(s.datetime)}
              >
                Next
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
