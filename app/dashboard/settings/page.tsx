'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { COMMON_TIMEZONES } from '@/lib/timezone/options';
import { User, Globe, Lock, Clock, Check, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [defaultMinNotice, setDefaultMinNotice] = useState(120);
  const [defaultMaxWindow, setDefaultMaxWindow] = useState(60);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.success && data.data) {
          const u = data.data;
          setName(u.name || '');
          setEmail(u.email || '');
          setUsername(u.username || '');
          setTimezone(u.timezone || 'America/New_York');
          setBio(u.bio || '');
          setAvatarUrl(u.avatarUrl || '');
          setDefaultMinNotice(u.defaultMinNotice ?? 120);
          setDefaultMaxWindow(u.defaultMaxWindow ?? 60);
        } else {
          setErrorMsg(data.error || 'Failed to load profile');
        }
      } catch {
        setErrorMsg('Failed to load user settings');
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setProfileSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          timezone,
          bio,
          avatarUrl,
          defaultMinNotice: Number(defaultMinNotice),
          defaultMaxWindow: Number(defaultMaxWindow),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to save profile settings');
        setProfileSaving(false);
        return;
      }

      triggerToast('Profile settings saved successfully');
    } catch {
      setErrorMsg('Failed to save profile settings');
    }
    setProfileSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordError(data.error || 'Failed to change password');
        setPasswordSaving(false);
        return;
      }

      triggerToast('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('Failed to change password');
    }
    setPasswordSaving(false);
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

  return (
    <div className="space-y-8 animate-in fade-in max-w-4xl">
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your profile details, public username, timezone, and default scheduling preferences
        </p>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {/* SECTION 1: Profile & Timezone Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Public Profile Settings</h2>
              <p className="text-xs text-slate-500">This information will be visible on your public scheduling pages</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Username *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              helperText={`Your public link: meetlio.com/${username || 'username'}`}
            />

            <Input
              label="Email Address"
              value={email}
              disabled
              helperText="Contact support to change email"
            />

            <Select
              label="Primary Timezone *"
              options={COMMON_TIMEZONES}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bio / About You
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief introduction displayed on your public booking page..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </Card>

        {/* SECTION 2: Booking Preferences */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Default Scheduling Preferences</h2>
              <p className="text-xs text-slate-500">Configure global defaults applied to new event types</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Minimum Notice (Minutes)"
              type="number"
              value={defaultMinNotice}
              onChange={(e) => setDefaultMinNotice(Number(e.target.value))}
              helperText="Minimum advance notice required for bookings (e.g. 120 = 2 hours)"
            />

            <Input
              label="Default Maximum Booking Window (Days)"
              type="number"
              value={defaultMaxWindow}
              onChange={(e) => setDefaultMaxWindow(Number(e.target.value))}
              helperText="How far into the future guests can schedule (e.g. 60 days)"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" type="submit" isLoading={profileSaving}>
              Save Profile & Preferences
            </Button>
          </div>
        </Card>
      </form>

      {/* SECTION 3: Security & Password */}
      <form onSubmit={handleChangePassword}>
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h2>
              <p className="text-xs text-slate-500">Update your account authentication password</p>
            </div>
          </div>

          {passwordError && <Alert variant="error">{passwordError}</Alert>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Current Password *"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="New Password *"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirm New Password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" type="submit" isLoading={passwordSaving}>
              Update Password
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
