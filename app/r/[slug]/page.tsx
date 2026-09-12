'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeetlioLogo } from '@/components/brand/logo';
import { GitFork, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PublicRoutingFormPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companySize, setCompanySize] = useState('11-50');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/routing?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setForm(data.form);
        }
      } catch {}
      setLoading(false);
    }
    loadForm();
  }, [slug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Evaluate rules or route based on companySize
    const hostUsername = form?.user?.username || 'alexsmith';

    if (companySize === '200+') {
      // Enterprise route
      router.push(`/${hostUsername}/60min-consultation`);
    } else {
      // Standard route
      router.push(`/${hostUsername}/30min-meeting`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-xs text-slate-400">Loading Meetlio Routing Form...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <MeetlioLogo className="h-8 text-slate-900 dark:text-white inline-block" />
      </div>

      <Card className="w-full max-w-lg p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs">
            <GitFork className="w-4 h-4" />
            <span>Interactive Qualifier</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {form?.name || form?.title || 'Screening & Demo Qualifier'}
          </h1>
          <p className="text-xs text-slate-500">
            {form?.description || 'Answer a few quick questions to be routed to the right booking experience.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">What is your company size? *</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="1-10">1 - 10 employees</option>
              <option value="11-50">11 - 50 employees</option>
              <option value="51-200">51 - 200 employees</option>
              <option value="200+">200+ employees (Enterprise Demo)</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 py-3"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Calendar Booking
          </Button>
        </form>
      </Card>
    </div>
  );
}
