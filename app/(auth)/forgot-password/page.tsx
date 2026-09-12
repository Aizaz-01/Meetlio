'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MeetlioLogo } from '@/components/brand/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}

    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <MeetlioLogo iconSize="w-10 h-10" className="text-2xl" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your registered email address to receive password reset instructions
          </p>
        </div>

        <Card className="p-6">
          {submitted ? (
            <div className="space-y-4">
              <Alert variant="success" title="Request Processed">
                If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
              </Alert>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Return to login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="alex@meetlio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
