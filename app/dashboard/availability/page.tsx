import React from 'react';
import { AvailabilityGrid } from '@/components/dashboard/availability-grid';
import { DateOverridesManager } from '@/components/dashboard/date-overrides';

export default function AvailabilityPage() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Availability & Scheduling
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure your weekly recurring hours, active timezone, and date-specific availability overrides.
        </p>
      </div>

      {/* Section 1: Weekly Recurring Schedule */}
      <AvailabilityGrid />

      {/* Section 2: Date Overrides (Holidays & Custom Hours) */}
      <DateOverridesManager />
    </div>
  );
}
