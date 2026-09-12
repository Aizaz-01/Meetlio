'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MeetlioLogo } from '@/components/brand/logo';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>
      </div>

      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            An unexpected application error occurred. You can retry the operation or return to the dashboard.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => reset()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
