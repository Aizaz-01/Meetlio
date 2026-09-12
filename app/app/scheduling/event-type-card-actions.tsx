'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit3, Copy, Trash2, Power } from 'lucide-react';
import Link from 'next/link';

export function EventTypeCardActions({ eventType }: { eventType: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      await fetch(`/api/events/${eventType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !eventType.isActive }),
      });
      router.refresh();
    } catch {}
    setLoading(false);
    setOpen(false);
  };

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/events/${eventType.id}/duplicate`, {
        method: 'POST',
      });
      router.refresh();
    } catch {}
    setLoading(false);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${eventType.name}"?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/events/${eventType.id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch {}
    setLoading(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 text-xs">
          <Link
            href={`/app/scheduling/edit/${eventType.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Event</span>
          </Link>

          <button
            onClick={handleToggleActive}
            disabled={loading}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Power className="w-3.5 h-3.5 text-slate-400" />
            <span>{eventType.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>

          <button
            onClick={handleDuplicate}
            disabled={loading}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
