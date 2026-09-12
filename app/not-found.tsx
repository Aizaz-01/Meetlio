import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MeetlioLogo } from '@/components/brand/logo';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <Link href="/">
          <MeetlioLogo iconSize="w-9 h-9" className="text-xl" />
        </Link>
      </div>

      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="w-14 h-14 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">404 Error</span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The page or scheduling link you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link href="/">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
