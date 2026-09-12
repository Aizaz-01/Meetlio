'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Plus, Clock, Video, Copy, ExternalLink, Trash2, Edit3, Check, MessageSquare, Share2, Code, Layers, Users, UserPlus, Shield } from 'lucide-react';
import Link from 'next/link';

export interface EventTypeRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  duration: number;
  kind?: string | null;
  maxAttendees?: number | null;
  locationType: string;
  locationInfo?: string | null;
  isActive: boolean;
  bufferBefore: number;
  bufferAfter: number;
  minimumNotice: number;
  maximumBookingWindow: number;
}

export interface QuestionRecord {
  id: string;
  label: string;
  type: string;
  options: string[];
  isRequired: boolean;
  order: number;
}

export interface HostRecord {
  id: string;
  name: string;
  email: string;
  username: string;
  priority?: number;
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [hostsModalOpen, setHostsModalOpen] = useState(false);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [embedType, setEmbedType] = useState<'inline' | 'popupWidget' | 'popupText'>('inline');

  const [selectedEvent, setSelectedEvent] = useState<EventTypeRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Hosts state
  const [assignedHosts, setAssignedHosts] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<HostRecord[]>([]);

  // Questions state
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [qLabel, setQLabel] = useState('');
  const [qType, setQType] = useState('SHORT_TEXT');
  const [qRequired, setQRequired] = useState(false);
  const [qOptions, setQOptions] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [kind, setKind] = useState('ONE_ON_ONE');
  const [maxAttendees, setMaxAttendees] = useState(1);
  const [locationType, setLocationType] = useState('GOOGLE_MEET');
  const [locationInfo, setLocationInfo] = useState('');
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [minimumNotice, setMinimumNotice] = useState(120);
  const [maximumBookingWindow, setMaximumBookingWindow] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [scheduleId, setScheduleId] = useState<string>('');
  const [userSchedules, setUserSchedules] = useState<Array<{ id: string; name: string; isDefault: boolean }>>([]);

  const fetchEventTypes = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [res, schedRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/availability/schedules'),
      ]);
      const data = await res.json();
      const schedData = await schedRes.json();

      if (data.success && Array.isArray(data.data)) {
        setEventTypes(data.data);
      }
      if (schedData.success && Array.isArray(schedData.data)) {
        setUserSchedules(schedData.data);
      }
    } catch {
      setErrorMsg('Failed to load event types');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setDuration(30);
    setKind('ONE_ON_ONE');
    setMaxAttendees(1);
    setLocationType('GOOGLE_MEET');
    setLocationInfo('');
    setBufferBefore(0);
    setBufferAfter(0);
    setMinimumNotice(120);
    setMaximumBookingWindow(60);
    setIsActive(true);
  };

  const handleDuplicate = async (event: EventTypeRecord) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Duplicated "${event.name}" successfully`);
        fetchEventTypes();
      } else {
        setErrorMsg(data.error?.message || data.error || 'Failed to duplicate event');
      }
    } catch {
      setErrorMsg('Failed to duplicate event');
    }
    setActionLoading(false);
  };

  const handleOpenHosts = async (event: EventTypeRecord) => {
    setSelectedEvent(event);
    setHostsModalOpen(true);
    try {
      const res = await fetch(`/api/events/${event.id}/hosts`);
      const data = await res.json();
      if (data.success && data.data) {
        setAssignedHosts(data.data.assignedHosts || []);
        setAvailableUsers(data.data.availableUsers || []);
      }
    } catch {}
  };

  const handleSaveHosts = async () => {
    if (!selectedEvent) return;
    setActionLoading(true);
    try {
      const payload = assignedHosts.map((h, idx) => ({
        userId: h.userId || h.user?.id || h.id,
        priority: idx,
      }));

      const res = await fetch(`/api/events/${selectedEvent.id}/hosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hosts: payload }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Co-hosts / Host priority saved successfully');
        setHostsModalOpen(false);
      }
    } catch {}
    setActionLoading(false);
  };

  const handleOpenEdit = (event: EventTypeRecord) => {
    setSelectedEvent(event);
    setName(event.name);
    setSlug(event.slug);
    setDescription(event.description || '');
    setDuration(event.duration);
    setKind(event.kind || 'ONE_ON_ONE');
    setMaxAttendees(event.maxAttendees || 1);
    setLocationType(event.locationType);
    setLocationInfo(event.locationInfo || '');
    setBufferBefore(event.bufferBefore);
    setBufferAfter(event.bufferAfter);
    setMinimumNotice(event.minimumNotice);
    setMaximumBookingWindow(event.maximumBookingWindow);
    setIsActive(event.isActive);
    setEditModalOpen(true);
  };

  const handleOpenQuestions = async (event: EventTypeRecord) => {
    setSelectedEvent(event);
    setQuestionsModalOpen(true);
    setQLabel('');
    setQOptions('');
    try {
      const res = await fetch(`/api/events/${event.id}/questions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setQuestions(data.data);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !qLabel.trim()) return;

    try {
      const optionsArray = qOptions.split(',').map((o) => o.trim()).filter(Boolean);
      const res = await fetch(`/api/events/${selectedEvent.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: qLabel.trim(),
          type: qType,
          isRequired: qRequired,
          options: optionsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQLabel('');
        setQOptions('');
        triggerToast('Custom question added');
        handleOpenQuestions(selectedEvent);
      }
    } catch {}
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/questions?questionId=${qId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Question removed');
        handleOpenQuestions(selectedEvent);
      }
    } catch {}
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          duration: Number(duration),
          kind,
          maxAttendees: Number(maxAttendees),
          locationType,
          locationInfo,
          scheduleId: scheduleId || undefined,
          bufferBefore: Number(bufferBefore),
          bufferAfter: Number(bufferAfter),
          minimumNotice: Number(minimumNotice),
          maximumBookingWindow: Number(maximumBookingWindow),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create event type');
        setActionLoading(false);
        return;
      }

      triggerToast('Event type created successfully');
      setCreateModalOpen(false);
      resetForm();
      fetchEventTypes();
    } catch {
      setErrorMsg('Failed to create event type');
    }
    setActionLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description,
          duration: Number(duration),
          kind,
          maxAttendees: Number(maxAttendees),
          locationType,
          locationInfo,
          scheduleId: scheduleId || undefined,
          bufferBefore: Number(bufferBefore),
          bufferAfter: Number(bufferAfter),
          minimumNotice: Number(minimumNotice),
          maximumBookingWindow: Number(maximumBookingWindow),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update event type');
        setActionLoading(false);
        return;
      }

      triggerToast('Event type updated successfully');
      setEditModalOpen(false);
      fetchEventTypes();
    } catch {
      setErrorMsg('Failed to update event type');
    }
    setActionLoading(false);
  };

  const handleToggleActive = async (event: EventTypeRecord) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !event.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Event ${!event.isActive ? 'activated' : 'deactivated'}`);
        fetchEventTypes();
      }
    } catch {}
  };

  const handleDeleteSubmit = async () => {
    if (!selectedEvent) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Event type deleted successfully');
        setDeleteModalOpen(false);
        fetchEventTypes();
      } else {
        setErrorMsg(data.error || 'Failed to delete event type');
      }
    } catch {
      setErrorMsg('Failed to delete event type');
    }
    setActionLoading(false);
  };

  const copyBookingLink = (slugStr: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/booking/alexsmith/${slugStr}`;
    navigator.clipboard.writeText(fullUrl);
    triggerToast('Public booking link copied to clipboard!');
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filteredEvents = eventTypes.filter((e) => {
    if (activeTab === 'ALL') return true;
    return (e.kind || 'ONE_ON_ONE') === activeTab;
  });

  const getEmbedSnippet = () => {
    if (!selectedEvent) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const bookingUrl = `${origin}/booking/alexsmith/${selectedEvent.slug}`;

    if (embedType === 'inline') {
      return `<iframe src="${bookingUrl}" width="100%" height="700" frameborder="0"></iframe>`;
    }
    if (embedType === 'popupWidget') {
      return `<script src="${origin}/embed.js"></script>\n<button onclick="Meetlio.initPopup('${bookingUrl}')">Book Meeting</button>`;
    }
    return `<a href="${bookingUrl}" target="_blank">Schedule ${selectedEvent.name}</a>`;
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Event Types</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, duplicate, assign co-hosts, and embed custom appointment types
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border font-semibold">
            Usage: {eventTypes.filter((e) => e.isActive).length} active event types
          </div>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Event Type
          </Button>
        </div>
      </div>

      {/* Kind Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'ALL', label: 'All Events' },
          { id: 'ONE_ON_ONE', label: 'One-on-One' },
          { id: 'GROUP', label: 'Group' },
          { id: 'COLLECTIVE', label: 'Collective' },
          { id: 'ROUND_ROBIN', label: 'Round Robin' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No event types found"
          description="Create your first event type or switch filter tabs."
          actionLabel="Create Event Type"
          onAction={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card
              key={event.id}
              hoverEffect
              className={`p-6 flex flex-col justify-between space-y-4 border ${
                event.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200/50 dark:border-slate-800/50 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={event.isActive ? 'success' : 'neutral'}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="brand" className="bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200">
                      {event.kind || 'ONE_ON_ONE'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {(event.kind === 'COLLECTIVE' || event.kind === 'ROUND_ROBIN') && (
                      <button
                        onClick={() => handleOpenHosts(event)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Manage Co-Hosts & Priority"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(event)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicate Event"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setEmbedModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Share & Embed Code"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenQuestions(event)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Manage Booking Questions"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {event.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {event.description || 'No description provided.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {event.duration} mins
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    {event.locationType.replace('_', ' ')}
                  </span>
                  {event.kind === 'GROUP' && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-brand-600 font-semibold">
                        <Users className="w-3.5 h-3.5" />
                        Max {event.maxAttendees || 1}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => copyBookingLink(event.slug)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(event)}
                  className="text-xs"
                >
                  {event.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CO-HOSTS & PRIORITY MODAL FOR COLLECTIVE & ROUND-ROBIN */}
      {selectedEvent && (
        <Modal
          isOpen={hostsModalOpen}
          onClose={() => setHostsModalOpen(false)}
          title={`Co-Hosts & Priority (${selectedEvent.name})`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500">
              {selectedEvent.kind === 'COLLECTIVE'
                ? 'Assign team co-hosts who must all be available for appointments.'
                : 'Assign hosts and set rotation priority for Round Robin booking selection.'}
            </p>

            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Assign Team Members</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableUsers.map((u) => {
                  const isAssigned = assignedHosts.some((h) => (h.userId || h.user?.id || h.id) === u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (isAssigned) {
                          setAssignedHosts((prev) => prev.filter((h) => (h.userId || h.user?.id || h.id) !== u.id));
                        } else {
                          setAssignedHosts((prev) => [...prev, { userId: u.id, user: u, priority: prev.length }]);
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isAssigned
                          ? 'bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-600'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-500">@{u.username} ({u.email})</div>
                      </div>
                      {isAssigned && <Check className="w-4 h-4 text-brand-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setHostsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveHosts} isLoading={actionLoading}>
                Save Host Assignments
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* EMBED CODE GENERATOR MODAL */}
      {selectedEvent && (
        <Modal
          isOpen={embedModalOpen}
          onClose={() => setEmbedModalOpen(false)}
          title={`Share & Embed (${selectedEvent.name})`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                onClick={() => setEmbedType('inline')}
                className={`px-3 py-1.5 rounded-lg font-semibold ${embedType === 'inline' ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
              >
                Inline Embed
              </button>
              <button
                onClick={() => setEmbedType('popupWidget')}
                className={`px-3 py-1.5 rounded-lg font-semibold ${embedType === 'popupWidget' ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
              >
                Popup Widget
              </button>
              <button
                onClick={() => setEmbedType('popupText')}
                className={`px-3 py-1.5 rounded-lg font-semibold ${embedType === 'popupText' ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
              >
                Popup Text
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Generated Code Snippet</label>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                {getEmbedSnippet()}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => copyBookingLink(selectedEvent.slug)}
                className="text-brand-600 font-semibold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Copy Direct Booking Link
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getEmbedSnippet());
                  triggerToast('Embed code copied to clipboard!');
                }}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy Embed Code
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MANAGING BOOKING QUESTIONS MODAL */}
      {selectedEvent && (
        <Modal
          isOpen={questionsModalOpen}
          onClose={() => setQuestionsModalOpen(false)}
          title={`Booking Questions (${selectedEvent.name})`}
        >
          <div className="space-y-6">
            <p className="text-xs text-slate-500">
              Customize input fields and questions guests must answer when booking this appointment.
            </p>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Configured Questions ({questions.length})
              </div>

              {questions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Default: Guest Name & Email are collected automatically. Add custom questions below.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q) => (
                    <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {q.label} {q.isRequired && <span className="text-rose-500">*</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Type: {q.type} {q.options.length > 0 && `(${q.options.join(', ')})`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Add New Question</div>

              <Input
                label="Question Label *"
                placeholder="e.g. What is your primary goal for this session?"
                value={qLabel}
                onChange={(e) => setQLabel(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Field Type"
                  options={[
                    { label: 'Short Text', value: 'SHORT_TEXT' },
                    { label: 'Long Text', value: 'LONG_TEXT' },
                    { label: 'Phone Number', value: 'PHONE' },
                    { label: 'Single Select', value: 'SINGLE_SELECT' },
                    { label: 'Multiple Select', value: 'MULTI_SELECT' },
                  ]}
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                />

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="qReq"
                    checked={qRequired}
                    onChange={(e) => setQRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600"
                  />
                  <label htmlFor="qReq" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Required Field
                  </label>
                </div>
              </div>

              {(qType === 'SINGLE_SELECT' || qType === 'MULTI_SELECT') && (
                <Input
                  label="Options (Comma separated)"
                  placeholder="Option 1, Option 2, Option 3"
                  value={qOptions}
                  onChange={(e) => setQOptions(e.target.value)}
                />
              )}

              <Button variant="primary" type="submit" size="sm" className="w-full">
                Add Question
              </Button>
            </form>
          </div>
        </Modal>
      )}

      {/* CREATE EVENT TYPE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Event Type"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Title *"
            placeholder="e.g. 30 Min Strategy Call"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
              }
            }}
            required
          />

          <Input
            label="URL Slug *"
            placeholder="e.g. 30min-strategy"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="Brief details about what will be discussed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Kind *"
              options={[
                { label: 'One-on-One Meeting', value: 'ONE_ON_ONE' },
                { label: 'Group Meeting', value: 'GROUP' },
                { label: 'Collective Meeting', value: 'COLLECTIVE' },
                { label: 'Round Robin Meeting', value: 'ROUND_ROBIN' },
              ]}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            />

            {kind === 'GROUP' ? (
              <Input
                label="Max Attendees *"
                type="number"
                min={1}
                value={String(maxAttendees)}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
                required
              />
            ) : (
              <Select
                label="Duration *"
                options={[
                  { label: '15 Minutes', value: '15' },
                  { label: '30 Minutes', value: '30' },
                  { label: '45 Minutes', value: '45' },
                  { label: '60 Minutes', value: '60' },
                  { label: '90 Minutes', value: '90' },
                ]}
                value={String(duration)}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            )}
          </div>

          <Select
            label="Location *"
            options={[
              { label: 'Google Meet', value: 'GOOGLE_MEET' },
              { label: 'Zoom', value: 'ZOOM' },
              { label: 'Microsoft Teams', value: 'TEAMS' },
              { label: 'Phone Call', value: 'PHONE' },
              { label: 'In-person Meeting', value: 'IN_PERSON' },
              { label: 'Custom Link', value: 'CUSTOM' },
            ]}
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Create Event Type
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT EVENT TYPE MODAL */}
      {selectedEvent && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Event Type"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Title *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="URL Slug *"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Event Kind *"
                options={[
                  { label: 'One-on-One Meeting', value: 'ONE_ON_ONE' },
                  { label: 'Group Meeting', value: 'GROUP' },
                  { label: 'Collective Meeting', value: 'COLLECTIVE' },
                  { label: 'Round Robin Meeting', value: 'ROUND_ROBIN' },
                ]}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              />

              <Select
                label="Duration *"
                options={[
                  { label: '15 Minutes', value: '15' },
                  { label: '30 Minutes', value: '30' },
                  { label: '45 Minutes', value: '45' },
                  { label: '60 Minutes', value: '60' },
                  { label: '90 Minutes', value: '90' },
                ]}
                value={String(duration)}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={actionLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {selectedEvent && (
        <ConfirmDialog
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteSubmit}
          title="Delete Event Type"
          description={`Are you sure you want to delete "${selectedEvent.name}"? This action cannot be undone.`}
          confirmText="Delete Event Type"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
