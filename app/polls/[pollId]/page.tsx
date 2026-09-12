'use client';

import React, { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { MeetlioLogo } from '@/components/brand/logo';
import { Vote, CheckCircle2, User, Mail } from 'lucide-react';
import Link from 'next/link';

export default function PublicPollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = use(params);
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [voterName, setVoterName] = useState('');
  const [voterEmail, setVoterEmail] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPoll() {
      setLoading(true);
      try {
        const res = await fetch(`/api/polls/${pollId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setPoll(data.data);
        } else {
          setErrorMsg(data.error || 'Poll not found');
        }
      } catch {
        setErrorMsg('Failed to load poll details');
      }
      setLoading(false);
    }
    fetchPoll();
  }, [pollId]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: selectedOptionId,
          voterName: voterName.trim(),
          voterEmail: voterEmail.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Your vote has been cast successfully! Thank you.');
        // Refresh poll
        const refreshed = await fetch(`/api/polls/${pollId}`);
        const refData = await refreshed.json();
        if (refData.success) setPoll(refData.data);
      } else {
        setErrorMsg(data.error || 'Failed to submit vote');
      }
    } catch {
      setErrorMsg('Failed to submit vote');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="h-40 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (errorMsg && !poll) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <Alert variant="error">{errorMsg}</Alert>
          <Link href="/">
            <Button variant="outline" size="sm">Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex flex-col items-center justify-center">
      <div className="mb-6">
        <Link href="/">
          <MeetlioLogo className="h-7 text-slate-900 dark:text-white" />
        </Link>
      </div>

      <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Group Meeting Poll</span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{poll.title}</h1>
          {poll.description && <p className="text-xs text-slate-500 mt-1">{poll.description}</p>}
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {poll.isFinalized ? (
          <Alert variant="info" className="text-center">
            This poll has been finalized by the host! A booking has been scheduled for the winning time slot.
          </Alert>
        ) : (
          <form onSubmit={handleVote} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Your Preferred Time Slot *
              </label>
              {poll.options.map((opt: any) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {new Date(opt.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(opt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(opt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {opt.votes?.length || 0} votes
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Input
                label="Your Name *"
                placeholder="Jane Doe"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                required
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
              />
              <Input
                label="Your Email *"
                type="email"
                placeholder="jane@example.com"
                value={voterEmail}
                onChange={(e) => setVoterEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={submitting || !selectedOptionId}
            >
              Cast Vote
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
