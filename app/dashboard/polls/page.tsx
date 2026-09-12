'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Vote, Plus, Share2, CheckCircle2, Clock, Trash2, Check } from 'lucide-react';

export interface PollOption {
  id: string;
  startTime: string;
  endTime: string;
  votes: any[];
}

export interface PollRecord {
  id: string;
  title: string;
  description?: string;
  duration: number;
  isFinalized: boolean;
  finalizedSlot?: string;
  options: PollOption[];
  createdAt: string;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<PollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<PollRecord | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [proposedTimes, setProposedTimes] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '', endTime: '' },
  ]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/polls');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPolls(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to load meeting polls');
      }
    } catch {
      setErrorMsg('Failed to load meeting polls');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleAddField = () => {
    setProposedTimes([...proposedTimes, { startTime: '', endTime: '' }]);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const validOptions = proposedTimes.filter((t) => t.startTime && t.endTime);
      if (validOptions.length === 0) {
        setErrorMsg('Please enter at least one valid proposed date & time slot');
        setActionLoading(false);
        return;
      }

      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          duration: Number(duration),
          options: validOptions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Meeting poll created successfully!');
        setCreateModalOpen(false);
        setTitle('');
        setDescription('');
        setProposedTimes([{ startTime: '', endTime: '' }]);
        fetchPolls();
      } else {
        setErrorMsg(data.error || 'Failed to create poll');
      }
    } catch {
      setErrorMsg('Failed to create poll');
    }
    setActionLoading(false);
  };

  const handleFinalizeOption = async (pollId: string, optionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Winning slot finalized & booking created!');
        fetchPolls();
      } else {
        setErrorMsg(data.error || 'Failed to finalize poll option');
      }
    } catch {
      setErrorMsg('Failed to finalize poll option');
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Meeting Polls</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Propose multiple meeting slots to participants and finalize the most voted time
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Meeting Poll
        </Button>
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <EmptyState
          title="No meeting polls created"
          description="Create a poll to let group participants vote on their preferred meeting time."
          actionLabel="Create Meeting Poll"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls.map((poll) => (
            <Card key={poll.id} className="p-6 space-y-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={poll.isFinalized ? 'success' : 'brand'}>
                    {poll.isFinalized ? 'Finalized' : 'Active Poll'}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">{poll.duration} mins</span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-xs text-slate-500 mt-1">{poll.description}</p>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Proposed Slots & Votes</p>
                  {poll.options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(opt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[11px] text-slate-400">{opt.votes.length} votes</p>
                      </div>
                      {!poll.isFinalized && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFinalizeOption(poll.id, opt.id)}
                          disabled={actionLoading}
                        >
                          Finalize Slot
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/polls/${poll.id}`);
                    triggerToast('Poll voting link copied to clipboard!');
                  }}
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                >
                  Share Poll Link
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Meeting Poll"
        description="Propose multiple datetime slots for your attendees to vote on."
      >
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <Input
            label="Poll Title *"
            placeholder="e.g. Q4 Strategy Planning Session"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Description (Optional)"
            placeholder="Additional context for participants"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Duration (Minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold"
            />
          </div>

          {/* Dynamic Proposed Times */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Proposed Slots
            </label>
            {proposedTimes.map((t, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={t.startTime}
                  onChange={(e) => {
                    const copy = [...proposedTimes];
                    copy[idx].startTime = e.target.value;
                    const st = new Date(e.target.value);
                    st.setMinutes(st.getMinutes() + Number(duration));
                    copy[idx].endTime = st.toISOString().slice(0, 16);
                    setProposedTimes(copy);
                  }}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
                <input
                  type="datetime-local"
                  value={t.endTime}
                  onChange={(e) => {
                    const copy = [...proposedTimes];
                    copy[idx].endTime = e.target.value;
                    setProposedTimes(copy);
                  }}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
              + Add Another Proposed Slot
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading}>
              Create Poll
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
