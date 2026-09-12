'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  Plus,
  Sparkles,
  CreditCard,
  X,
  Lightbulb,
  CheckSquare,
  Zap,
  Users,
} from 'lucide-react';
import { formatTimeInZone } from '@/lib/scheduling/timezone';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    activeEventTypes: 0,
  });
  const [subData, setSubData] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [bookingsRes, eventsRes, subRes] = await Promise.all([
          fetch('/api/bookings?tab=upcoming'),
          fetch('/api/events'),
          fetch('/api/billing/subscription'),
        ]);

        const bookingsData = await bookingsRes.json();
        const eventsData = await eventsRes.json();
        const subJson = await subRes.json();

        let allBookings: any[] = [];
        if (bookingsData.success && Array.isArray(bookingsData.data?.bookings)) {
          allBookings = bookingsData.data.bookings;
          setRecentBookings(allBookings.slice(0, 5));
        } else if (bookingsData.success && Array.isArray(bookingsData.data)) {
          allBookings = bookingsData.data;
          setRecentBookings(allBookings.slice(0, 5));
        }

        let activeEventsCount = 0;
        if (eventsData.success && Array.isArray(eventsData.data)) {
          activeEventsCount = eventsData.data.filter((e: any) => e.isActive).length;
        }

        if (subJson.success && subJson.data) {
          setSubData(subJson.data);
        }

        setMetrics({
          totalBookings: allBookings.length,
          upcomingBookings: allBookings.filter((b: any) => b.status === 'CONFIRMED').length,
          completedBookings: allBookings.filter((b: any) => b.status === 'COMPLETED').length,
          activeEventTypes: activeEventsCount,
        });
      } catch {}
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  const plan = subData?.plan || { name: 'Free Plan', maxBookingsPerMonth: 50 };
  const usage = subData?.usage || { bookingCount: 0, bookingPercentage: 0 };

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in">
      {/* MAIN LEFT / CENTER CONTENT AREA */}
      <div className="flex-1 space-y-6">
        {/* Top Banner Card: Connect Gmail / Integration workflow */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <button
            onClick={() => {}}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Connect Gmail to power your email workflow
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Securely send emails, sync conversations, create templates and reach multiple contacts at once — with drafting tools at your fingertips.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="rounded-full px-4 text-xs">
                  Learn more
                </Button>
              </Link>
              <Link href="/dashboard/webhooks">
                <Button variant="outline" size="sm" className="rounded-full px-4 text-xs font-semibold border-slate-300">
                  📧 Connect Gmail
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Hero Welcome / Contacts overview */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stay organized as you build relationships
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Contacts are automatically created and updated when a Calendly meeting is booked. View meeting history, access key details, and schedule your next conversation — all in one place.
          </p>
          <div className="pt-2 flex items-center gap-4">
            <Link href="/dashboard/event-types">
              <Button variant="outline" size="sm" className="rounded-full px-5">
                + Add contact
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button variant="primary" size="sm" className="rounded-full px-5 bg-brand-600 hover:bg-brand-700">
                📅 Book your first meeting
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Card className="p-5 space-y-1 border-l-4 border-l-brand-600">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Meetings</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : metrics.upcomingBookings}
            </div>
          </Card>

          <Card className="p-5 space-y-1 border-l-4 border-l-emerald-500">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : metrics.totalBookings}
            </div>
          </Card>

          <Card className="p-5 space-y-1 border-l-4 border-l-indigo-500">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Event Types</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : metrics.activeEventTypes}
            </div>
          </Card>

          <Card className="p-5 space-y-1 border-l-4 border-l-blue-500">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Meetings</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {loading ? '...' : metrics.completedBookings}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Activity</h2>
            <Link href="/dashboard/bookings" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <Card className="p-8 text-center text-xs text-slate-500">
              No upcoming meetings currently scheduled. Share your public booking link to start taking appointments!
            </Card>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <Card key={b.id} hoverEffect className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm shrink-0">
                        {b.guestName ? b.guestName.substring(0, 2).toUpperCase() : 'GS'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {b.eventType?.name || 'Meeting'} with {b.guestName}
                        </h3>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>{b.guestEmail}</span>
                          <span>•</span>
                          <span>{b.guestTimezone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {formatTimeInZone(new Date(b.startTime), b.guestTimezone, 'EEE, MMM d @ hh:mm a')}
                        </div>
                        <div className="text-slate-400">{b.eventType?.duration || 30} mins</div>
                      </div>
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: "Get started" Onboarding Panel */}
      {showGuide && (
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Get started</h3>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Task 1 */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Get to know Calendly</h4>
                  <p className="text-[11px] text-slate-500">1 video</p>
                </div>
              </div>

              {/* Task 2 */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">The perfect scheduling setup</h4>
                  <p className="text-[11px] text-slate-500">2 tasks</p>
                </div>
              </div>

              {/* Task 3 */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Automate meeting prep and follow-up</h4>
                  <p className="text-[11px] text-slate-500">2 tasks</p>
                </div>
              </div>

              {/* Task 4 */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Using Calendly with a team</h4>
                  <p className="text-[11px] text-slate-500">2 tasks</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => setShowGuide(false)}
                className="w-full py-2 px-4 rounded-full border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Don&apos;t show again
              </button>
            </div>
          </Card>
        </aside>
      )}
    </div>
  );
}
