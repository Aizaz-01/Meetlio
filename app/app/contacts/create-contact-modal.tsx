'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export function CreateContactModal({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, company, jobTitle, notes }),
      });

      if (res.ok) {
        setOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setNotes('');
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
        Add Contact
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Contact</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={loading}>
                  Save Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
