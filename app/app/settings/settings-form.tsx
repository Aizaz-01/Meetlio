'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';
import { User, Lock, Globe, Check, ShieldCheck, CreditCard } from 'lucide-react';

export function SettingsForm({ user }: { user: any }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [timezone, setTimezone] = useState(user.timezone || 'UTC');
  const [bio, setBio] = useState(user.bio || '');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [msg, setMsg] = useState('');
  const [secMsg, setSecMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, timezone, bio }),
      });

      if (res.ok) {
        setMsg('Profile updated successfully!');
        router.refresh();
      } else {
        setMsg('Failed to update profile.');
      }
    } catch {
      setMsg('Error saving settings.');
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSecMsg('New passwords do not match');
      return;
    }
    setSavingSecurity(true);
    setSecMsg('');

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setSecMsg('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecMsg('Failed to update password. Verify current password.');
      }
    } catch {
      setSecMsg('Error changing password.');
    }
    setSavingSecurity(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <User className="w-4 h-4 text-brand-600" /> Display Profile & Handle
        </h3>

        {msg && <Alert variant={msg.includes('success') ? 'success' : 'error'}>{msg}</Alert>}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />

          <Input
            label="Public Booking Handle / Slug"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            helperText={`Booking URL: meetlio.com/${username}`}
            required
          />

          <Select
            label="Primary Timezone"
            options={COMMON_TIMEZONES.map((tz) => ({ label: `${tz.label} (${tz.value})`, value: tz.value }))}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bio / Welcome Note</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio shown on your public booking page..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none h-20"
            />
          </div>

          <Button type="submit" variant="primary" isLoading={savingProfile} leftIcon={<Check className="w-4 h-4" />}>
            Save Profile Changes
          </Button>
        </form>
      </Card>

      {/* Security & Password */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-rose-600" /> Security & Password Change
        </h3>

        {secMsg && <Alert variant={secMsg.includes('success') ? 'success' : 'error'}>{secMsg}</Alert>}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="outline" isLoading={savingSecurity} leftIcon={<ShieldCheck className="w-4 h-4" />}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Billing Plan */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Subscription Plan
        </h3>

        <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-200 dark:border-brand-800">
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">Pro Unlimited Plan</div>
            <div className="text-xs text-slate-500">Unlimited event types, calendar integrations, and custom branding</div>
          </div>
          <Button variant="primary" size="sm">
            Manage Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}
