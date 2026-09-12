'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { GitFork, Plus, Share2, ArrowRight, Check } from 'lucide-react';

export interface RoutingFormRecord {
  id: string;
  title: string;
  description?: string;
  rules: any[];
  createdAt: string;
}

export default function RoutingPage() {
  const [forms, setForms] = useState<RoutingFormRecord[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [conditionField, setConditionField] = useState('Company Size');
  const [conditionValue, setConditionValue] = useState('100+');
  const [targetType, setTargetType] = useState('EVENT_TYPE');
  const [targetValue, setTargetValue] = useState('');

  const fetchForms = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [res, evtRes] = await Promise.all([
        fetch('/api/forms'),
        fetch('/api/events'),
      ]);
      const data = await res.json();
      const evtData = await evtRes.json();

      if (data.success && Array.isArray(data.data)) setForms(data.data);
      if (evtData.success && Array.isArray(evtData.data)) setEventTypes(evtData.data);
    } catch {
      setErrorMsg('Failed to load routing forms');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          rules: [
            {
              conditionField,
              conditionValue,
              targetType,
              targetValue: targetValue || (eventTypes[0]?.slug || '30min'),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Routing form created successfully!');
        setCreateModalOpen(false);
        setTitle('');
        setDescription('');
        fetchForms();
      } else {
        setErrorMsg(data.error || 'Failed to create routing form');
      }
    } catch {
      setErrorMsg('Failed to create routing form');
    }
    setActionLoading(false);
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Routing Forms</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Qualify visitors with custom intake questions and route them to the right booking calendar automatically
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Routing Form
        </Button>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          title="No routing forms created"
          description="Create a routing form to direct enterprise or qualified leads to specialized booking calendars."
          actionLabel="Create Routing Form"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="brand">Active Form</Badge>
                  <span className="text-xs text-slate-400 font-mono">{form.rules.length} rule(s)</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{form.title}</h3>
                  {form.description && <p className="text-xs text-slate-500 mt-1">{form.description}</p>}
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Routing Rules</p>
                  {form.rules.map((rule: any) => (
                    <div key={rule.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>If `{rule.conditionField}` = &quot;{rule.conditionValue}&quot;</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
                      <span>{rule.targetValue}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`);
                    triggerToast('Routing form URL copied to clipboard!');
                  }}
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                >
                  Share Form Link
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Routing Form Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Routing Form"
        description="Set up qualification questions and destination event types."
      >
        <form onSubmit={handleCreateForm} className="space-y-4">
          <Input
            label="Form Title *"
            placeholder="e.g. Sales Qualification Router"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Description (Optional)"
            placeholder="Helpful details for visitors"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Rule #1</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="If Question / Field"
                value={conditionField}
                onChange={(e) => setConditionField(e.target.value)}
              />
              <Input
                label="Equals Value"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Route To Event Type
              </label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                {eventTypes.map((evt) => (
                  <option key={evt.id} value={evt.slug}>
                    {evt.name} (/{evt.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading}>
              Create Form
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
