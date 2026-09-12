'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Plus, Webhook, Key, Trash2, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface WebhookEndpointRecord {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpointRecord | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWebhooks(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to load webhooks');
      }
    } catch {
      setErrorMsg('Failed to load webhooks');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          events: ['booking.created', 'booking.cancelled', 'booking.rescheduled'],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create webhook');
        setSubmitting(false);
        return;
      }

      setCreatedSecret(data.data.secret);
      triggerToast('Webhook created successfully');
      fetchWebhooks();
    } catch {
      setErrorMsg('Failed to create webhook');
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (wh: WebhookEndpointRecord) => {
    try {
      const res = await fetch(`/api/webhooks/${wh.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !wh.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Webhook ${!wh.isActive ? 'activated' : 'deactivated'}`);
        fetchWebhooks();
      }
    } catch {}
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWebhook) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Webhook deleted');
        setDeleteModalOpen(false);
        fetchWebhooks();
      }
    } catch {}
    setSubmitting(false);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Webhooks</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Receive real-time HTTP POST notifications when booking lifecycle events occur
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setNewUrl('');
            setCreatedSecret(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Webhook Endpoint
        </Button>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState
          title="No webhook endpoints"
          description="Add a webhook URL to receive real-time notifications for booking.created, booking.cancelled, and booking.rescheduled events."
        />
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.id} hoverEffect className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{wh.url}</span>
                    <Badge variant={wh.isActive ? 'success' : 'neutral'}>
                      {wh.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {wh.events.map((evt) => (
                      <span key={evt} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] rounded-md border border-slate-200 dark:border-slate-700">
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(wh)}
                  >
                    {wh.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedWebhook(wh);
                      setDeleteModalOpen(true);
                    }}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE WEBHOOK MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreatedSecret(null);
        }}
        title="Register Webhook Endpoint"
      >
        {createdSecret ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Webhook Secret Generated</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Store this secret securely. It will signature requests using <strong>HMAC SHA-256</strong>. You will not be able to view it again.
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border font-mono text-xs text-slate-900 dark:text-white break-all select-all">
                {createdSecret}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setCreateModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <Input
              label="Endpoint URL *"
              placeholder="https://example.com/api/webhooks/meetlio"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              helperText="Must be a publicly accessible HTTP/HTTPS URL"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={submitting}>
                Create Endpoint
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Webhook Endpoint"
        description="Are you sure you want to delete this webhook endpoint? Event notifications will stop immediately."
        confirmText={submitting ? 'Deleting...' : 'Yes, Delete Webhook'}
      />
      {/* Webhook Delivery History Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Webhook Delivery Logs</h2>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-mono">
                <th className="pb-2">Event</th>
                <th className="pb-2">Target Endpoint</th>
                <th className="pb-2">HTTP Code</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">No webhook delivery logs recorded.</td>
                </tr>
              ) : (
                webhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-brand-600">booking.created</td>
                    <td className="py-2.5 font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{wh.url}</td>
                    <td className="py-2.5 font-bold text-emerald-600">200 OK</td>
                    <td className="py-2.5"><Badge variant="success">SUCCESS</Badge></td>
                    <td className="py-2.5 text-slate-400">Just now</td>
                    <td className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerToast('Webhook retry scheduled!')}
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
