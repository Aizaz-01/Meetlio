'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MeetlioLogo } from '@/components/brand/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing password reset token. Please check your reset link.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password. The link may be expired.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setSubmitted(true);
    } catch {
      setError('An error occurred during password reset. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      {submitted ? (
        <div className="space-y-4">
          <Alert variant="success" title="Password Reset Successful">
            Your password has been updated. You can now log in with your new credentials.
          </Alert>
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Proceed to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {!token && (
            <Alert variant="warning">
              No reset token detected in URL. Make sure you opened the complete reset link.
            </Alert>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={!token}>
            Update Password
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <MeetlioLogo iconSize="w-10 h-10" className="text-2xl" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Set new password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose a strong password to secure your account
          </p>
        </div>

        <Suspense fallback={<Card className="p-6 text-center text-xs text-slate-500">Loading token...</Card>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
