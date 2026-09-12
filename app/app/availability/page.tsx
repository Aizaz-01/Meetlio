import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvailabilityScheduleManager } from './availability-schedule-manager';
import { DateOverridesManager } from './date-overrides-manager';
import { Clock, Calendar, ShieldCheck, Plus } from 'lucide-react';

export default async function AvailabilityPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch or initialize default availability schedule
  let schedule = await db.availabilitySchedule.findFirst({
    where: { userId: user.id },
    include: { availabilities: { orderBy: { dayOfWeek: 'asc' } } },
  });

  if (!schedule) {
    schedule = await db.availabilitySchedule.create({
      data: {
        userId: user.id,
        name: 'Working Hours',
        isDefault: true,
        timeZone: user.timezone || 'UTC',
        timezone: user.timezone || 'UTC',
        availabilities: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            userId: user.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
          })),
        },
      },
      include: { availabilities: { orderBy: { dayOfWeek: 'asc' } } },
    });
  }

  // Fetch Date Overrides
  const overrides = await db.availabilityOverride.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
  });

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Availability Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define recurring weekly working hours, vacation date overrides, and default buffer rules.
          </p>
        </div>

        <Badge variant="brand" className="py-1 px-3 text-xs w-fit">
          ✨ Timezone: {user.timezone || 'UTC'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Weekly Recurring Hours Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" /> Weekly Recurring Schedule
                </h2>
                <p className="text-xs text-slate-500">Active Schedule: <strong>{schedule.name}</strong></p>
              </div>
            </div>

            <AvailabilityScheduleManager schedule={schedule} userId={user.id} />
          </Card>
        </div>

        {/* Right 1 Col: Date Overrides & Vacation Blocks */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" /> Date Overrides & Holidays
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Block holidays or add extra availability for specific dates.</p>
            </div>

            <DateOverridesManager initialOverrides={overrides} userId={user.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
