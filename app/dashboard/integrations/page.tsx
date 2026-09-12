'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  Calendar,
  Video,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

export interface IntegrationApp {
  id: string;
  connectionId?: string;
  name: string;
  category: 'Calendar' | 'Video Conferencing';
  description: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'ZOOM' | 'TEAMS' | 'MEET';
  connected: boolean;
  providerAccountEmail?: string;
  lastSyncedAt?: string;
  syncError?: string;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'CONFIGURATION_REQUIRED' | 'DEVELOPMENT_MODE' | 'ERROR';
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationApp[]>([
    {
      id: 'google-cal',
      name: 'Google Calendar',
      category: 'Calendar',
      description: 'Sync Meetlio bookings and block external busy slots automatically.',
      provider: 'GOOGLE',
      connected: false,
      status: 'NOT_CONNECTED',
    },
    {
      id: 'outlook-cal',
      name: 'Microsoft Outlook Calendar',
      category: 'Calendar',
      description: 'Synchronize office schedules and import busy periods into Meetlio.',
      provider: 'OUTLOOK',
      connected: false,
      status: 'NOT_CONNECTED',
    },
    {
      id: 'google-meet',
      name: 'Google Meet',
      category: 'Video Conferencing',
      description: 'Auto-generate video conference links for scheduled meetings.',
      provider: 'MEET',
      connected: true,
      status: 'CONNECTED',
    },
    {
      id: 'zoom',
      name: 'Zoom Video Communications',
      category: 'Video Conferencing',
      description: 'Create unique Zoom meeting rooms for client appointments.',
      provider: 'ZOOM',
      connected: true,
      status: 'CONNECTED',
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      category: 'Video Conferencing',
      description: 'Host team consultations via Microsoft Teams meeting links.',
      provider: 'TEAMS',
      connected: true,
      status: 'CONNECTED',
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar/connections');
      const data = await res.json();
      if (data.success && data.data) {
        const google = data.data.google;
        const outlook = data.data.outlook;

        setIntegrations((prev) =>
          prev.map((item) => {
            if (item.provider === 'GOOGLE' && google) {
              return {
                ...item,
                connectionId: google.id,
                connected: Boolean(google.connected),
                status: google.status || (google.connected ? 'CONNECTED' : 'NOT_CONNECTED'),
                providerAccountEmail: google.providerAccountEmail,
                lastSyncedAt: google.lastSyncedAt,
                syncError: google.syncError,
              };
            }
            if (item.provider === 'OUTLOOK' && outlook) {
              return {
                ...item,
                connectionId: outlook.id,
                connected: Boolean(outlook.connected),
                status: outlook.status || (outlook.connected ? 'CONNECTED' : 'NOT_CONNECTED'),
                providerAccountEmail: outlook.providerAccountEmail,
                lastSyncedAt: outlook.lastSyncedAt,
                syncError: outlook.syncError,
              };
            }
            return item;
          })
        );
      }
    } catch {}
    setLoading(false);
  }

  const handleConnect = (app: IntegrationApp) => {
    if (app.provider === 'GOOGLE') {
      window.location.href = '/api/auth/google';
    } else if (app.provider === 'OUTLOOK') {
      window.location.href = '/api/auth/outlook';
    }
  };

  const handleDisconnect = async (app: IntegrationApp) => {
    if (!app.connectionId) return;
    setActionLoading(app.id);
    try {
      const res = await fetch(`/api/calendar/connections/${app.connectionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`${app.name} disconnected`);
        fetchConnections();
      } else {
        triggerToast(data.error || 'Failed to disconnect');
      }
    } catch {
      triggerToast('Failed to disconnect');
    }
    setActionLoading(null);
  };

  const handleSync = async (app: IntegrationApp) => {
    if (!app.connectionId) return;
    setActionLoading(`sync_${app.id}`);
    try {
      const res = await fetch(`/api/calendar/connections/${app.connectionId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`${app.name} synced (${data.data.syncedEventsCount} events)`);
        fetchConnections();
      } else {
        triggerToast(data.error || 'Failed to sync');
      }
    } catch {
      triggerToast('Failed to sync');
    }
    setActionLoading(null);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <Alert variant="success" className="shadow-xl bg-slate-900 text-white border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Integrations & Calendar Connections
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect your Google & Outlook calendars for two-way busy time synchronization and automated video links.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((app) => {
          const isSyncing = actionLoading === `sync_${app.id}`;
          const isDisconnecting = actionLoading === app.id;

          return (
            <Card
              key={app.id}
              className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                      {app.category === 'Calendar' ? (
                        <Calendar className="w-6 h-6" />
                      ) : (
                        <Video className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{app.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">{app.category}</span>
                    </div>
                  </div>

                  <div>
                    {app.status === 'CONNECTED' && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected
                      </Badge>
                    )}
                    {app.status === 'CONFIGURATION_REQUIRED' && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5" />
                        Credentials Needed
                      </Badge>
                    )}
                    {app.status === 'DEVELOPMENT_MODE' && (
                      <Badge variant="neutral" className="flex items-center gap-1 font-mono">
                        Dev Simulator
                      </Badge>
                    )}
                    {app.status === 'ERROR' && (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Error
                      </Badge>
                    )}
                    {app.status === 'NOT_CONNECTED' && (
                      <Badge variant="neutral" className="flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {app.description}
                </p>

                {app.providerAccountEmail && (
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between">
                    <span>Account: {app.providerAccountEmail}</span>
                    {app.lastSyncedAt && (
                      <span className="text-[10px] text-slate-400 font-sans">
                        Synced: {new Date(app.lastSyncedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}

                {app.syncError && (
                  <p className="text-xs text-rose-500 font-semibold">{app.syncError}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                {app.status === 'CONNECTED' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(app)}
                      disabled={isSyncing}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Re-sync'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(app)}
                      disabled={isDisconnecting}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : app.status === 'CONFIGURATION_REQUIRED' ? (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Add credentials in .env to connect
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleConnect(app)}>
                      Connect OAuth
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(app)}
                  >
                    Connect {app.name}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
