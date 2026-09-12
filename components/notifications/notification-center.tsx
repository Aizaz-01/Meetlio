'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, Mail } from 'lucide-react';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: 'READ' })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs flex gap-3 transition-colors ${
                    !n.read && n.status !== 'READ' ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''
                  }`}
                >
                  <div className="p-2 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-lg h-fit shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {n.title || n.type || 'Booking Update'}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 leading-tight">
                      {n.body || 'New activity recorded on your Meetlio schedule.'}
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
