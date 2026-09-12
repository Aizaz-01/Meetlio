'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Check, CreditCard, Sparkles, AlertTriangle, ShieldCheck, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function BillingDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadBillingData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/plans'),
      ]);

      const subJson = await subRes.json();
      const plansJson = await plansRes.json();

      if (subJson.success) {
        setSubData(subJson.data);
      } else {
        setErrorMsg(subJson.error || 'Failed to load subscription details');
      }

      if (plansJson.success && Array.isArray(plansJson.data)) {
        setPlans(plansJson.data);
      }
    } catch {
      setErrorMsg('Failed to load billing information');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleCheckout = async (planSlug: string) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, interval }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Switched to ${planSlug.toUpperCase()} tier!`);
        loadBillingData();
      } else {
        setErrorMsg(data.error || 'Failed to process plan checkout');
      }
    } catch {
      setErrorMsg('Failed to process plan checkout');
    }
    setActionLoading(false);
  };

  const handleSubscriptionAction = async (action: 'cancel' | 'resume') => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`Subscription ${action === 'cancel' ? 'cancelled' : 'resumed'}`);
        loadBillingData();
      } else {
        setErrorMsg(data.error || 'Failed to update subscription');
      }
    } catch {
      setErrorMsg('Failed to update subscription');
    }
    setActionLoading(false);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 w-48 rounded-xl" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  const currentPlan = subData?.plan || {};
  const usage = subData?.usage || {};
  const isCancelled = subData?.subscription?.cancelAtPeriodEnd;

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl">
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

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Billing & Subscriptions</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your subscription tier, usage allowances, and billing preferences
        </p>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {/* Warning Alerts based on usage percentage */}
      {usage.warningState === 'LIMIT_REACHED' && (
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Monthly booking or resource limit reached! Upgrade your subscription plan to continue taking appointments.</span>
          </div>
        </Alert>
      )}

      {usage.warningState === 'WARNING_90' && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Warning: You have reached 90% of your monthly booking limit.</span>
          </div>
        </Alert>
      )}

      {/* SECTION 1: Current Subscription Card */}
      <Card className="p-6 space-y-6 border-l-4 border-l-brand-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{currentPlan.name || 'Free Plan'}</h2>
              <Badge variant={subData?.subscription?.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {subData?.subscription?.status || 'ACTIVE'}
              </Badge>
              {isCancelled && <Badge variant="warning">Cancels at period end</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentPlan.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {isCancelled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubscriptionAction('resume')}
                isLoading={actionLoading}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Resume Plan
              </Button>
            ) : currentPlan.slug !== 'free' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSubscriptionAction('cancel')}
                isLoading={actionLoading}
                className="text-rose-500 hover:text-rose-600"
              >
                Cancel Subscription
              </Button>
            ) : null}
          </div>
        </div>

        {/* Real PostgreSQL Usage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Monthly Bookings</span>
              <span>
                {usage.bookingCount} / {currentPlan.maxBookingsPerMonth === -1 ? 'Unlimited' : currentPlan.maxBookingsPerMonth}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usage.bookingPercentage >= 90 ? 'bg-rose-500' : usage.bookingPercentage >= 75 ? 'bg-amber-500' : 'bg-brand-600'
                }`}
                style={{ width: `${usage.bookingPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Active Event Types</span>
              <span>
                {usage.eventTypeCount} / {currentPlan.maxEventTypes === -1 ? 'Unlimited' : currentPlan.maxEventTypes}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${usage.eventTypePercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Webhooks</span>
              <span>
                {usage.webhookCount} / {currentPlan.maxWebhooks === -1 ? 'Unlimited' : currentPlan.maxWebhooks}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${usage.webhookPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: Plan Comparison Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subscription Plans</h2>
            <p className="text-xs text-slate-500">Choose the plan that fits your scheduling volume</p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                interval === 'monthly' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                interval === 'yearly' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Yearly Billing (Save 17%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan.slug === p.slug;
            const price = interval === 'yearly' ? p.priceYearly : p.priceMonthly;

            return (
              <Card
                key={p.id}
                hoverEffect
                className={`p-6 flex flex-col justify-between space-y-6 border ${
                  isCurrent ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
                    {isCurrent && <Badge variant="brand">Current Plan</Badge>}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${price}</span>
                    <span className="text-xs text-slate-500">/{interval === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px]">{p.description}</p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{p.maxEventTypes === -1 ? 'Unlimited' : `${p.maxEventTypes}`} Event Type</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{p.maxBookingsPerMonth === -1 ? 'Unlimited' : `${p.maxBookingsPerMonth}`} Bookings/mo</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{p.maxWebhooks === -1 ? 'Unlimited' : `${p.maxWebhooks}`} Webhook Endpoints</span>
                    </div>
                    {p.analyticsEnabled && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Advanced Analytics</span>
                      </div>
                    )}
                    {p.prioritySupport && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>24/7 Dedicated Support</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  disabled={isCurrent}
                  onClick={() => handleCheckout(p.slug)}
                  isLoading={actionLoading}
                  className="w-full"
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${p.name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
