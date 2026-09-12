import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreditCard, DollarSign, ArrowUpRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    include: { booking: { include: { eventType: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const totalRevenue = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount / 100, 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payments & Paid Bookings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Collect payment upfront before invitees confirm paid consultation calls (Stripe & PayPal integration architecture).
          </p>
        </div>

        <Badge variant="brand" className="py-1 px-3 text-xs w-fit">
          💳 Payment Provider: Stripe (Dev Simulator Active)
        </Badge>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue Collected</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              ${totalRevenue.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Gross processed volume</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Transactions</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {payments.length}
            </div>
            <span className="text-[11px] text-slate-500">Successful checkout sessions</span>
          </div>
          <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stripe Status</span>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Ready for Live Keys
            </div>
            <span className="text-[11px] text-slate-500">Dev simulator enabled</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction History</h3>
          <span className="text-xs text-slate-400 font-mono">Currency: USD</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<CreditCard className="w-12 h-12 text-slate-400" />}
              title="No payment transactions recorded"
              description="Configure paid event types in your Event Type settings to require payment during booking."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {p.booking?.eventType?.name || 'Paid Meeting Session'}
                  </div>
                  <div className="text-slate-400">
                    Invitee: {p.booking?.guestName || p.booking?.guestEmail || 'Client'}
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    +${(p.amount / 100).toFixed(2)} {p.currency}
                  </div>
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : 'neutral'}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
