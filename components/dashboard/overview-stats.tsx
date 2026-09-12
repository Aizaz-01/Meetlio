import React from 'react';
import { Card } from '../ui/card';
import { Calendar, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

export function OverviewStats() {
  const stats = [
    {
      label: 'Upcoming Bookings',
      value: '12',
      change: '+18% this month',
      icon: Calendar,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400',
    },
    {
      label: 'Active Event Types',
      value: '4',
      change: '2 custom links',
      icon: Clock,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      label: 'Completed Meetings',
      value: '48',
      change: '100% completion rate',
      icon: CheckCircle2,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      label: 'Hours Scheduled',
      value: '26.5 hrs',
      change: 'Avg 30 min per call',
      icon: TrendingUp,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} hoverEffect className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.change}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
