import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/prisma';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IntegrationConnectButton } from './integration-connect-button';
import {
  Calendar,
  Video,
  Zap,
  Grid,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const connections = await db.calendarConnection.findMany({
    where: { userId: user.id },
  });

  const integrations = await db.integration.findMany({
    where: { userId: user.id },
  });

  const isConnected = (provider: string) => {
    const cal = connections.find((c) => c.provider === provider && c.active);
    const integ = integrations.find((i) => i.provider === provider && i.active);
    return Boolean(cal || integ);
  };

  const categories = [
    {
      category: 'Calendar Connections',
      items: [
        {
          id: 'GOOGLE',
          title: 'Google Calendar',
          description: 'Check busy times and auto-add Google Meet video links to invitees.',
          connected: isConnected('GOOGLE'),
          badge: 'Google Workspace',
        },
        {
          id: 'OUTLOOK',
          title: 'Microsoft Outlook / Office 365',
          description: 'Sync your Microsoft 365 work calendar and check conflict slots.',
          connected: isConnected('OUTLOOK'),
          badge: 'Microsoft 365',
        },
      ],
    },
    {
      category: 'Video Conferencing',
      items: [
        {
          id: 'GOOGLE_MEET',
          title: 'Google Meet',
          description: 'Automatically generate Google Meet video call links for every booking.',
          connected: true, // Always available
          badge: 'Built-in',
        },
        {
          id: 'ZOOM',
          title: 'Zoom Video Communications',
          description: 'Auto-create unique Zoom meeting URLs upon successful booking.',
          connected: isConnected('ZOOM'),
          badge: 'Video API',
        },
        {
          id: 'TEAMS',
          title: 'Microsoft Teams',
          description: 'Add Teams call links directly into calendar invitations.',
          connected: isConnected('TEAMS'),
          badge: 'Video API',
        },
      ],
    },
    {
      category: 'Automations & CRM Architecture',
      items: [
        {
          id: 'ZAPIER',
          title: 'Zapier Webhook Connector',
          description: 'Trigger 5,000+ app automations on booking creation or cancellation.',
          connected: isConnected('ZAPIER'),
          badge: 'Automation',
        },
        {
          id: 'HUBSPOT',
          title: 'HubSpot CRM',
          description: 'Sync new booking invitees directly into HubSpot contacts.',
          connected: isConnected('HUBSPOT'),
          badge: 'CRM Architecture',
        },
        {
          id: 'SALESFORCE',
          title: 'Salesforce Enterprise',
          description: 'Log scheduled appointments directly into Salesforce CRM accounts.',
          connected: isConnected('SALESFORCE'),
          badge: 'CRM Architecture',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Integrations & Apps Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect calendars, video conferencing tools, webhooks, and enterprise CRMs.
        </p>
      </div>

      <div className="space-y-8">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{cat.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.items.map((item) => (
                <Card key={item.id} className="p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" className="text-[10px]">
                        {item.badge}
                      </Badge>
                      <Badge variant={item.connected ? 'success' : 'neutral'} className="text-[10px]">
                        {item.connected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <IntegrationConnectButton provider={item.id} connected={item.connected} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
