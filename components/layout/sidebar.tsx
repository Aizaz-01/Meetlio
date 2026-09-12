'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MeetlioLogo } from '@/components/brand/logo';
import {
  Home,
  CalendarDays,
  Clock,
  BookOpenCheck,
  Users,
  Zap,
  GitFork,
  CreditCard,
  Grid,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building,
} from 'lucide-react';

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  user?: {
    name?: string;
    email?: string;
    username: string;
    avatarUrl?: string;
  } | null;
}

const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/app', icon: Home },
  { name: 'Scheduling', href: '/app/scheduling', icon: CalendarDays },
  { name: 'Availability', href: '/app/availability', icon: Clock },
  { name: 'Meetings', href: '/app/meetings', icon: BookOpenCheck },
  { name: 'Contacts', href: '/app/contacts', icon: Users },
  { name: 'Workflows', href: '/app/workflows', icon: Zap },
  { name: 'Routing Forms', href: '/app/routing', icon: GitFork },
  { name: 'Team & Orgs', href: '/app/team', icon: Building },
  { name: 'Payments', href: '/app/payments', icon: CreditCard },
  { name: 'Integrations', href: '/app/integrations', icon: Grid },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
];

export function Sidebar({ mobileOpen = false, onMobileClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const username = user?.username || 'alexsmith';

  const isCurrentActive = (href: string) => {
    if (href === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const content = (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header & Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
        <Link href="/app" onClick={onMobileClose} className="flex items-center gap-2 overflow-hidden">
          <MeetlioLogo iconSize="w-8 h-8" showText={!collapsed} className="text-xl font-bold" />
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Action: Create Event */}
      <div className="p-3">
        <Link
          href="/app/scheduling/new"
          onClick={onMobileClose}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition-all ${
            collapsed ? 'w-10 h-10 p-0 mx-auto' : 'w-full'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Create Event</span>}
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = isCurrentActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 font-bold border border-brand-200/50 dark:border-brand-800/40 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={item.name}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <Link
          href="/app/settings"
          onClick={onMobileClose}
          className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <Link
          href={`/${username}`}
          target="_blank"
          className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="View Booking Page"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-brand-500" />
          {!collapsed && <span className="truncate">Public Booking Link</span>}
        </Link>

        {/* User Profile */}
        <div className={`pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between ${collapsed ? 'flex-col gap-2' : ''}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'Alex Smith'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'alex@meetlio.com'}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
