'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Calendar, User, Mail, Video, XCircle, Check, Globe, Download, RefreshCw, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTimeInZone } from '@/lib/scheduling/timezone';

export interface BookingRecord {
  id: string;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'COMPLETED' | 'NO_SHOW';
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancelToken?: string | null;
  rescheduleToken?: string | null;
  createdAt: string;
  eventType?: {
    name: string;
    slug: string;
    duration: number;
    locationType: string;
  };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Search & Pagination state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = useCallback(async (tab: string, searchQuery: string, currentPage: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParams = new URLSearchParams({
        tab,
        page: String(currentPage),
        limit: '20',
      });
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/bookings?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        if (Array.isArray(data.data?.bookings)) {
          setBookings(data.data.bookings);
          if (data.data.pagination) {
            setPagination(data.data.pagination);
          }
        } else if (Array.isArray(data.data)) {
          setBookings(data.data);
        } else {
          setBookings([]);
        }
      } else {
        setErrorMsg(data.error || 'Failed to load bookings');
      }
    } catch {
      setErrorMsg('Failed to load bookings');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings(activeTab, search, page);
  }, [activeTab, search, page, fetchBookings]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const handleRowClick = (booking: BookingRecord) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  };

  const handleOpenCancel = (booking: BookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleOpenReschedule = (booking: BookingRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBooking(booking);
    setNewRescheduleTime('');
    setRescheduleModalOpen(true);
  };

  const executeHostCancel = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        triggerToast('Booking cancelled successfully');
        setCancelModalOpen(false);
        setDetailModalOpen(false);
        fetchBookings(activeTab, search, page);
      } else {
        setErrorMsg(data.error || 'Failed to cancel booking');
      }
    } catch {
      setErrorMsg('Failed to cancel booking');
    }
    setActionLoading(false);
  };

  const executeHostReschedule = async () => {
    if (!selectedBooking || !newRescheduleTime) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          newStartTime: newRescheduleTime,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setErrorMsg('This time slot is no longer available. Please choose another datetime.');
        setActionLoading(false);
        return;
      }

      if (data.success) {
        triggerToast('Booking rescheduled successfully');
        setRescheduleModalOpen(false);
        setDetailModalOpen(false);
        fetchBookings(activeTab, search, page);
      } else {
        setErrorMsg(data.error || 'Failed to reschedule booking');
      }
    } catch {
      setErrorMsg('Failed to reschedule booking');
    }
    setActionLoading(false);
  };

  const handleApproveBooking = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerToast('Booking approved successfully!');
        setDetailModalOpen(false);
        fetchBookings(activeTab, search, page);
      } else {
        setErrorMsg(data.error || 'Failed to approve booking');
      }
    } catch {
      setErrorMsg('Failed to approve booking');
    }
    setActionLoading(false);
  };

  const handleRejectBooking = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Booking rejected');
        setDetailModalOpen(false);
        fetchBookings(activeTab, search, page);
      } else {
        setErrorMsg(data.error || 'Failed to reject booking');
      }
    } catch {
      setErrorMsg('Failed to reject booking');
    }
    setActionLoading(false);
  };

  const handleMarkAttendance = async (id: string, attendance: 'ATTENDED' | 'NO_SHOW') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Attendance updated: ${attendance}`);
        setDetailModalOpen(false);
        fetchBookings(activeTab, search, page);
      } else {
        setErrorMsg(data.error || 'Failed to update attendance');
      }
    } catch {
      setErrorMsg('Failed to update attendance');
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Bookings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View and manage client appointments, lifecycle state, and past meetings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/bookings/export?format=csv', '_blank')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search name, email, event..."
              value={search}
              onChange={handleSearchChange}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'past', label: 'Past' },
          { id: 'cancelled', label: 'Cancelled' },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} bookings`}
          description={search ? `No bookings found matching "${search}".` : `There are currently no ${activeTab} appointments.`}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              hoverEffect
              onClick={() => handleRowClick(booking)}
              className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm shrink-0">
                  {booking.guestName ? booking.guestName.substring(0, 2).toUpperCase() : 'GS'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {booking.eventType?.name || 'Meeting'} with {booking.guestName}
                    </h3>
                    <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'neutral'}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {booking.guestEmail}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {booking.guestTimezone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 text-xs">
                <div className="text-left sm:text-right">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {formatTimeInZone(new Date(booking.startTime), booking.guestTimezone, 'EEE, MMM d, yyyy')}
                  </div>
                  <div className="text-slate-500">
                    {formatTimeInZone(new Date(booking.startTime), booking.guestTimezone, 'hh:mm a')} - {formatTimeInZone(new Date(booking.endTime), booking.guestTimezone, 'hh:mm a')}
                  </div>
                </div>

                {booking.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveBooking(booking.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectBooking(booking.id, 'Host rejected')}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleMarkAttendance(booking.id, 'ATTENDED'); }}
                      title="Mark Attended"
                    >
                      Attended
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenReschedule(booking, e)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenCancel(booking, e)}
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Booking Details"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedBooking.eventType?.name || 'Meeting'}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono">{selectedBooking.id}</span>
                </div>
              </div>
              <Badge variant={selectedBooking.status === 'CONFIRMED' ? 'success' : 'neutral'}>
                {selectedBooking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Guest Name</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.guestName}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Guest Email</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.guestEmail}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Scheduled Time</span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formatTimeInZone(new Date(selectedBooking.startTime), selectedBooking.guestTimezone, 'EEEE, MMMM d, yyyy @ hh:mm a')}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Guest Timezone</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedBooking.guestTimezone}</p>
              </div>
            </div>

            {selectedBooking.status === 'CANCELLED' && selectedBooking.cancellationReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1">
                <span className="font-semibold text-rose-700 dark:text-rose-400 text-xs">Cancellation Reason</span>
                <p className="text-xs text-slate-600 dark:text-slate-300">{selectedBooking.cancellationReason}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedBooking.cancelToken && (
                <a href={`/api/public/bookings/${selectedBooking.cancelToken}/calendar`} target="_blank">
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download .ics
                  </Button>
                </a>
              )}

              {selectedBooking.status === 'CONFIRMED' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenReschedule(selectedBooking);
                    }}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenCancel(selectedBooking);
                    }}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    Cancel Meeting
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* HOST CANCEL MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Cancel Meeting (Host Action)"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel the appointment with <strong>{selectedBooking.guestName}</strong>? An email notification will be sent to the guest.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason provided to guest..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Keep Appointment
              </Button>
              <Button variant="primary" onClick={executeHostCancel} isLoading={actionLoading} className="bg-rose-600 hover:bg-rose-700">
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* HOST RESCHEDULE MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          title="Reschedule Meeting (Host Action)"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select a new start datetime for <strong>{selectedBooking.guestName}</strong>.
            </p>

            <Input
              label="New Start Datetime (ISO format) *"
              type="datetime-local"
              value={newRescheduleTime}
              onChange={(e) => setNewRescheduleTime(e.target.value)}
              required
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={executeHostReschedule} isLoading={actionLoading}>
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
