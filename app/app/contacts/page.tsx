import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateContactModal } from './create-contact-modal';
import { Users, Search, Plus, Mail, Calendar, ArrowRight, Building, Phone } from 'lucide-react';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const query = params.q || '';

  const contacts = await db.contact.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contacts CRM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage attendee relationship details, past appointment history, and lead notes.
          </p>
        </div>

        <CreateContactModal userId={user.id} />
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <form className="w-full">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contacts by name, email, or company..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </form>
      </Card>

      {/* Contacts Grid / Table */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        {contacts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-400" />}
              title="No contacts found"
              description="Contacts will automatically populate as invitees book meetings with you."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {contacts.map((c) => (
              <div key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{c.name}</span>
                      {c.company && (
                        <Badge variant="neutral" className="text-[10px]">
                          {c.company}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {c.email}
                      </span>
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/app/contacts/${c.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Contact Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
