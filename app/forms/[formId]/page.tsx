'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { MeetlioLogo } from '@/components/brand/logo';
import { GitFork, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PublicFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [answers, setAnswers] = useState<Record<string, string>>({
    'Company Size': '100+',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchForm() {
      setLoading(true);
      try {
        const res = await fetch(`/api/forms/${formId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setForm(data.data);
        } else {
          setErrorMsg(data.error || 'Routing form not found');
        }
      } catch {
        setErrorMsg('Failed to load routing form');
      }
      setLoading(false);
    }
    fetchForm();
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (data.success && data.data?.redirectUrl) {
        router.push(data.data.redirectUrl);
      } else {
        setErrorMsg(data.error || 'Routing failed');
      }
    } catch {
      setErrorMsg('Failed to submit form');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-40 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center justify-center">
      <div className="mb-6">
        <Link href="/">
          <MeetlioLogo className="h-7 text-slate-900 dark:text-white" />
        </Link>
      </div>

      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Lead Qualifier</span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{form.title}</h1>
          {form.description && <p className="text-xs text-slate-500 mt-1">{form.description}</p>}
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company Size *"
            placeholder="e.g. 100+"
            value={answers['Company Size'] || ''}
            onChange={(e) => setAnswers({ ...answers, 'Company Size': e.target.value })}
            required
          />

          <Button type="submit" className="w-full h-11" disabled={submitting}>
            Find Available Calendar <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
