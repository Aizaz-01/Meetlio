'use client';

import React, { useState, useEffect } from 'react';
import { Search, Calendar, Users, BookOpenCheck, GitFork, Zap, Settings, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GlobalSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ isOpen, onClose }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    events: any[];
    bookings: any[];
    contacts: any[];
  }>({ events: [], bookings: [], contacts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ events: [], bookings: [], contacts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || { events: [], bookings: [], contacts: [] });
        }
      } catch (err) {}
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search event types, meetings, contacts, workflows..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-4">
          {!query && (
            <div className="text-center py-8 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-500 dark:text-slate-400">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto pt-2">
                <Link href="/app/scheduling" onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">Event Types</span>
                </Link>
                <Link href="/app/meetings" onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">Meetings</span>
                </Link>
                <Link href="/app/contacts" onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">Contacts</span>
                </Link>
                <Link href="/app/workflows" onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">Workflows</span>
                </Link>
              </div>
            </div>
          )}

          {loading && <div className="text-center py-6 text-xs text-slate-400">Searching Meetlio workspace...</div>}

          {query && !loading && (
            <div className="space-y-4">
              {/* Event Types */}
              {results.events?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Types</div>
                  {results.events.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/app/scheduling`}
                      onClick={onClose}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-brand-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.name || evt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({evt.duration} mins)</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Meetings */}
              {results.bookings?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bookings & Meetings</div>
                  {results.bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/app/meetings/${b.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpenCheck className="w-4 h-4 text-indigo-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{b.guestName || b.inviteeName}</div>
                          <div className="text-[10px] text-slate-400">{b.guestEmail || b.inviteeEmail}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Contacts */}
              {results.contacts?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contacts</div>
                  {results.contacts.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/contacts/${c.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}

              {results.events?.length === 0 && results.bookings?.length === 0 && results.contacts?.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matching results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
