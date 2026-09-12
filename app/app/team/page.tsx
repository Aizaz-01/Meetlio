import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Building, Users, Plus, Shield, Mail, UserCheck } from 'lucide-react';
import { CreateOrgModal } from './create-org-modal';

export default async function TeamSchedulingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orgs = await db.organization.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: true,
      members: { include: { user: true } },
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team Scheduling & Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members, invite teammates, and create Collective & Round Robin event types.
          </p>
        </div>

        <CreateOrgModal userId={user.id} />
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={<Building className="w-12 h-12 text-slate-400" />}
          title="No organization created yet"
          description="Create your company organization to collaborate with teammates, share availability, and round-robin meetings."
          action={<CreateOrgModal userId={user.id} />}
        />
      ) : (
        <div className="space-y-6">
          {orgs.map((org) => (
            <Card key={org.id} className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{org.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">slug: {org.slug}</span>
                  </div>
                </div>

                <Badge variant="brand">OWNER: {org.owner.name}</Badge>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Organization Members ({org.members.length})
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {org.members.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                          {m.user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{m.user.name}</div>
                          <div className="text-[11px] text-slate-400">{m.user.email}</div>
                        </div>
                      </div>

                      <Badge variant={m.role === 'OWNER' ? 'brand' : m.role === 'ADMIN' ? 'warning' : 'neutral'}>
                        {m.role}
                      </Badge>
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
