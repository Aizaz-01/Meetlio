'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, Plug, RefreshCw } from 'lucide-react';

export function IntegrationConnectButton({ provider, connected }: { provider: string; connected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (provider === 'GOOGLE') {
        window.location.href = '/api/auth/google';
        return;
      }
      if (provider === 'OUTLOOK') {
        window.location.href = '/api/auth/outlook';
        return;
      }

      // Toggle dev mock integration connection
      await fetch('/api/integrations/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, active: !connected }),
      });
      router.refresh();
    } catch {}
    setLoading(false);
  };

  if (provider === 'GOOGLE_MEET') {
    return (
      <Button variant="ghost" size="sm" className="w-full text-emerald-600 font-bold" disabled leftIcon={<Check className="w-4 h-4" />}>
        Active by Default
      </Button>
    );
  }

  return (
    <Button
      variant={connected ? 'outline' : 'primary'}
      size="sm"
      className="w-full"
      onClick={handleToggle}
      isLoading={loading}
      leftIcon={connected ? <Check className="w-4 h-4 text-emerald-500" /> : <Plug className="w-4 h-4" />}
    >
      {connected ? 'Connected (Click to Disconnect)' : 'Connect App'}
    </Button>
  );
}
