'use client';

import React, { useState } from 'react';
import { Menu, Search, Settings as SettingsIcon, LogOut, Plus, HelpCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { GlobalSearchDialog } from '@/components/search/global-search-dialog';

export interface TopNavProps {
  onMenuClick: () => void;
  user?: {
    name: string;
    email: string;
    username: string;
  } | null;
}

export function TopNav({ onMenuClick, user }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getTitle = () => {
    if (pathname === '/app') return 'Dashboard Overview';
    if (pathname.startsWith('/app/scheduling')) return 'Event Types & Scheduling';
    if (pathname.startsWith('/app/availability')) return 'Availability Schedules';
    if (pathname.startsWith('/app/meetings')) return 'Meetings Management';
    if (pathname.startsWith('/app/contacts')) return 'Contacts & CRM';
    if (pathname.startsWith('/app/workflows')) return 'Workflows & Automations';
    if (pathname.startsWith('/app/routing')) return 'Routing Forms';
    if (pathname.startsWith('/app/team')) return 'Team Organizations';
    if (pathname.startsWith('/app/payments')) return 'Payments & Earnings';
    if (pathname.startsWith('/app/integrations')) return 'Integrations Hub';
    if (pathname.startsWith('/app/analytics')) return 'Analytics & Insights';
    if (pathname.startsWith('/app/settings')) return 'Account Settings';
    return 'Meetlio Workspace';
  };

  const displayName = user?.name || 'Alex Smith';
  const displayEmail = user?.email || 'alex@meetlio.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setProfileDropdownOpen(false);
    setIsLoggingOut(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Hamburger & Dynamic Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {getTitle()}
          </h2>
        </div>

        {/* Middle/Right Search Trigger & Actions */}
        <div className="flex items-center gap-3">
          {/* Cmd+K Search Input Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="font-mono text-[10px] bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Mobile Search Icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          {/* Quick Create Button */}
          <Link href="/app/scheduling/new">
            <Button
              variant="primary"
              size="sm"
              className="rounded-full px-3.5 bg-brand-600 hover:bg-brand-700 font-semibold text-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">New Event</span>
            </Button>
          </Link>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initials}
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
                </div>
                <Link
                  href="/app/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
