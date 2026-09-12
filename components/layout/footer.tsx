import React from 'react';
import Link from 'next/link';
import { MeetlioLogo } from '../brand/logo';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <MeetlioLogo className="text-white" />
            <p className="text-sm text-slate-400 max-w-sm">
              Effortless scheduling for professionals, freelancers, and high-performing teams.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard/event-types" className="hover:text-white transition-colors">
                  Event Types
                </Link>
              </li>
              <li>
                <Link href="/dashboard/availability" className="hover:text-white transition-colors">
                  Availability Rules
                </Link>
              </li>
              <li>
                <Link href="/dashboard/calendar" className="hover:text-white transition-colors">
                  Calendar Sync
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/booking/demo/30min" className="hover:text-white transition-colors">
                  Live Booking Demo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard Overview
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Meetlio. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built for seamless timezone-aware meeting scheduling.</p>
        </div>
      </div>
    </footer>
  );
}
