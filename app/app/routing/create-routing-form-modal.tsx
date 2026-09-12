'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { GitFork, Plus, X, Trash2 } from 'lucide-react';

export function CreateRoutingFormModal({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Sales Intake & Demo Qualifier');
  const [slug, setSlug] = useState('demo-qualification');
  const [description, setDescription] = useState('Answer a few quick questions to book the right demo with our team.');

  // Questions
  const [questions, setQuestions] = useState([
    { id: 'q1', label: 'Company Size', type: 'DROPDOWN', options: ['1-10', '11-50', '51-200', '200+'], required: true },
  ]);

  // Rules
  const [conditionValue, setConditionValue] = useState('200+');
  const [destinationType, setDestinationType] = useState('EVENT_TYPE');
  const [destinationSlug, setDestinationSlug] = useState('30min-meeting');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title: name,
          slug,
          description,
          questions,
          rules: [
            {
              conditionField: 'Company Size',
              conditionValue,
              destinationType,
              targetType: destinationType,
              destinationId: destinationSlug,
              targetValue: destinationSlug,
            },
          ],
        }),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
        Create Routing Form
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Build Routing Form</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Form Name *" value={name} onChange={(e) => setName(e.target.value)} required />

              <Input label="URL Slug *" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} required />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Form Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none h-16"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">Sample Routing Rule Logic</div>
                <div>IF <strong>Company Size</strong> equals <strong>200+</strong></div>
                <div>THEN route to event slug <strong>/30min-meeting</strong></div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                  Save & Publish Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
