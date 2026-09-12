import React from 'react';
import { db } from '@/lib/db/prisma';
import { seedDefaultPlans } from '@/lib/billing/seed-plans';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeetlioLogo } from '@/components/brand/logo';
import { Check, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meetlio Pricing — Simple Scheduling Plans',
  description: 'Choose the scheduling plan that fits your business. Transparent monthly and yearly pricing with no hidden fees.',
};

export default async function PublicPricingPage() {
  let plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: 'asc' },
  });

  if (plans.length === 0) {
    plans = await seedDefaultPlans();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center p-4 sm:p-6 lg:p-12">
      {/* Header Navigation */}
      <div className="w-full max-w-6xl flex items-center justify-between pb-8">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">Get Started Free</Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl space-y-4 py-8">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Simple plans for seamless scheduling
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Start for free and scale as your appointment volume grows. No hidden fees or surprise charges.
        </p>
      </div>

      {/* Plans Cards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        {plans.map((plan) => (
          <Card key={plan.id} hoverEffect className="p-8 flex flex-col justify-between space-y-8 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">${plan.priceMonthly}</span>
                <span className="text-xs text-slate-500 font-semibold">/month</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{plan.maxEventTypes === -1 ? 'Unlimited' : `${plan.maxEventTypes}`} Event Type</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{plan.maxBookingsPerMonth === -1 ? 'Unlimited' : `${plan.maxBookingsPerMonth}`} Monthly Bookings</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{plan.maxWebhooks === -1 ? 'Unlimited' : `${plan.maxWebhooks}`} Webhook Endpoints</span>
                </div>
                {plan.analyticsEnabled && (
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>PostgreSQL Analytics Dashboard</span>
                  </div>
                )}
                {plan.prioritySupport && (
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>24/7 Priority Support</span>
                  </div>
                )}
              </div>
            </div>

            <Link href="/signup" className="w-full">
              <Button variant={plan.slug === 'pro' ? 'primary' : 'outline'} className="w-full">
                Get Started
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-3xl py-12 space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 text-xs">
          <Card className="p-5 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Can I upgrade or downgrade at any time?</h4>
            <p className="text-slate-500 leading-relaxed">Yes, you can change your subscription tier at any time from your billing dashboard.</p>
          </Card>

          <Card className="p-5 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">What happens when I reach my monthly booking limit?</h4>
            <p className="text-slate-500 leading-relaxed">When your monthly booking limit is reached, guest booking pages will display a clear limit notification and prevent over-booking until your plan resets or is upgraded.</p>
          </Card>

          <Card className="p-5 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Are there any setup fees?</h4>
            <p className="text-slate-500 leading-relaxed">No setup fees. You only pay the listed subscription price.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
