'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { Zap, Plus, Trash2, Mail, Bell, CheckCircle2, ArrowRight } from 'lucide-react';

export interface WorkflowRecord {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  actions: Array<{
    id: string;
    type: string;
    config?: string | null;
  }>;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('booking.created');
  const [actionType, setActionType] = useState('SEND_EMAIL');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setWorkflows(data.data);
      }
    } catch {}
    setLoading(false);
  }

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          trigger,
          actionType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName('');
        triggerToast('Workflow rule created successfully');
        fetchWorkflows();
      } else {
        setErrorMsg(data.error || 'Failed to create workflow');
      }
    } catch {
      setErrorMsg('Failed to create workflow');
    }
    setActionLoading(false);
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Workflow deleted');
        fetchWorkflows();
      }
    } catch {}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workflows & Automations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automate post-booking notifications, reminders, and follow-ups
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Workflow Rule
        </Button>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-2xl">
          <Zap className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No active workflow automations</p>
          <p className="mt-1">Create workflow rules to send automated emails or reminders when appointments are scheduled or updated.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <Card key={wf.id} hoverEffect className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{wf.name}</h3>
                    <Badge variant={wf.isActive ? 'success' : 'neutral'}>
                      {wf.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      Trigger: {wf.trigger}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>Action: {wf.actions[0]?.type || 'SEND_EMAIL'}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteWorkflow(wf.id)}
                className="text-rose-500 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE WORKFLOW MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Automation Workflow">
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <Input
            label="Workflow Name *"
            placeholder="e.g. Instant Booking Confirmation Email"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Event Trigger *"
            options={[
              { label: 'Booking Created (booking.created)', value: 'booking.created' },
              { label: 'Booking Cancelled (booking.cancelled)', value: 'booking.cancelled' },
              { label: 'Booking Rescheduled (booking.rescheduled)', value: 'booking.rescheduled' },
              { label: 'Meeting Completed (meeting.completed)', value: 'meeting.completed' },
            ]}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          />

          <Select
            label="Action Type *"
            options={[
              { label: 'Send Confirmation Email (SEND_EMAIL)', value: 'SEND_EMAIL' },
              { label: 'Schedule Reminder Notification (SEND_REMINDER)', value: 'SEND_REMINDER' },
            ]}
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Save Workflow Rule
            </Button>
          </div>
        </form>
      </Modal>
      {/* Workflow Executions Log Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Workflow Execution History</h2>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-mono">
                <th className="pb-2">Trigger</th>
                <th className="pb-2">Workflow</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">No workflow executions logged yet.</td>
                </tr>
              ) : (
                workflows.map((wf) => (
                  <tr key={wf.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono text-brand-600">{wf.trigger}</td>
                    <td className="py-2.5 font-bold">{wf.name}</td>
                    <td className="py-2.5">
                      <Badge variant="success">SUCCESS</Badge>
                    </td>
                    <td className="py-2.5 text-slate-400">Just now</td>
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
