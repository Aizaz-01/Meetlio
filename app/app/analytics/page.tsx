import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Calendar, XCircle, UserX, CheckCircle2 } from 'lucide-react';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Real database metrics
  const [totalBookings, cancelledCount, noShowCount, eventTypes, recentBookings] = await Promise.all([
    db.booking.count({ where: { userId: user.id } }),
    db.booking.count({ where: { userId: user.id, status: 'CANCELLED' } }),
    db.booking.count({ where: { userId: user.id, attendance: 'NO_SHOW' } }),
    db.eventType.findMany({
      where: { userId: user.id },
      include: { _count: { select: { bookings: true } } },
    }),
    db.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0.0';
  const noShowRate = totalBookings > 0 ? ((noShowCount / totalBookings) * 100).toFixed(1) : '0.0';

  // Find most popular event type
  const sortedEvents = [...eventTypes].sort((a, b) => b._count.bookings - a._count.bookings);
  const mostPopular = sortedEvents[0]?.name || 'N/A';

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" /> Analytics & Scheduling Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor total bookings, completion metrics, cancellation rates, and event popularity.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalBookings}</div>
            <span className="text-[11px] text-slate-500">Lifetime volume</span>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancellation Rate</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{cancellationRate}%</div>
            <span className="text-[11px] text-slate-500">{cancelledCount} cancelled total</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl">
            <XCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No-Show Rate</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{noShowRate}%</div>
            <span className="text-[11px] text-slate-500">{noShowCount} unattended calls</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-2xl">
            <UserX className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Event Type</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[140px]">
              {mostPopular}
            </div>
            <span className="text-[11px] text-slate-500">Highest volume link</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Charts & Popularity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Event Type Distribution</h3>
          <div className="space-y-3 pt-2">
            {eventTypes.map((evt) => {
              const count = evt._count.bookings;
              const pct = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div key={evt.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                    <span>{evt.name}</span>
                    <span>{count} bookings ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity Stream</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentBookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{b.guestName || b.guestEmail}</div>
                  <div className="text-slate-400 text-[10px]">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={b.status === 'CANCELLED' ? 'danger' : 'success'}>
                  {b.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
