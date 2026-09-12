import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateWorkflowModal } from './create-workflow-modal';
import { Zap, Plus, ArrowDown, Mail, Bell, Webhook, Clock, CheckCircle2 } from 'lucide-react';

export default async function WorkflowsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const workflows = await db.workflow.findMany({
    where: { userId: user.id },
    include: { actions: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workflows & Automations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate email confirmations, 24-hour reminders, post-meeting follow-ups, and webhook triggers.
          </p>
        </div>

        <CreateWorkflowModal userId={user.id} />
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-12 h-12 text-slate-400" />}
          title="No automated workflows set up"
          description="Create your first automated workflow to send email reminders before meetings and follow-up emails after meetings."
          action={<CreateWorkflowModal userId={user.id} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((wf) => (
            <Card key={wf.id} className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-50 dark:bg-brand-950 text-brand-600 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{wf.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Trigger: {wf.trigger}</span>
                  </div>
                </div>
                <Badge variant={wf.active ? 'success' : 'neutral'}>
                  {wf.active ? 'Active' : 'Disabled'}
                </Badge>
              </div>

              {/* Visual Flow Representation */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-brand-600 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>When {wf.trigger.replace('.', ' ')}</span>
                </div>

                <div className="pl-6 border-l-2 border-slate-300 dark:border-slate-700 space-y-2">
                  {wf.actions.map((act, idx) => (
                    <div key={act.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{act.actionType || act.type}: {act.timing || 'Immediate'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
