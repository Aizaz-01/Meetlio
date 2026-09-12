import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateRoutingFormModal } from './create-routing-form-modal';
import { GitFork, Plus, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';

export default async function RoutingFormsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const forms = await db.routingForm.findMany({
    where: { userId: user.id },
    include: { questions: true, rules: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Routing Forms
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Qualify invitees with custom questions and route them to the right event type or team member.
          </p>
        </div>

        <CreateRoutingFormModal userId={user.id} />
      </div>

      {forms.length === 0 ? (
        <EmptyState
          icon={<GitFork className="w-12 h-12 text-slate-400" />}
          title="No routing forms created yet"
          description="Build routing forms to ask screening questions before sending invitees to specific booking pages."
          action={<CreateRoutingFormModal userId={user.id} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((f) => {
            const publicFormUrl = `${appUrl}/r/${f.slug}`;
            return (
              <Card key={f.id} className="p-6 space-y-4 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitFork className="w-5 h-5 text-brand-600" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{f.name || f.title}</h3>
                    </div>
                    <Badge variant={f.active ? 'success' : 'neutral'}>
                      {f.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500">{f.description || 'Screening & Qualification Routing Form'}</p>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>{f.questions.length} Questions defined</div>
                    <div>{f.rules.length} Conditional rules</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <CopyButton value={publicFormUrl} label="Copy Form Link" className="text-xs" />
                  <Link href={`/r/${f.slug}`} target="_blank">
                    <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Open Form Engine
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
