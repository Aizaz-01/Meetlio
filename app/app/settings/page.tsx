import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SettingsForm } from './settings-form';
import { User, Shield, CreditCard, Calendar, Sliders, Lock } from 'lucide-react';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-brand-600" /> Account & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your display profile, security credentials, booking handle, and billing subscription.
        </p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}
