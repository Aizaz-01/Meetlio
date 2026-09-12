import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Globe,
  Bell,
  Link as LinkIcon,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Easy Scheduling',
      description: 'Let clients and partners book meetings seamlessly without endless back-and-forth emails.',
      icon: Calendar,
      badge: 'Core Engine',
    },
    {
      title: 'Custom Meeting Types',
      description: 'Define 15-min quick calls, 30-min discovery sessions, or 60-min strategic consults.',
      icon: SlidersHorizontal,
      badge: 'Flexible',
    },
    {
      title: 'Availability Control',
      description: 'Set custom weekly recurring hours, add date overrides, and protect your personal focus time.',
      icon: Clock,
      badge: 'Smart Rules',
    },
    {
      title: 'Personalized Booking Links',
      description: 'Share your elegant meetlio.com/username link anywhere — bio, email signature, or chat.',
      icon: LinkIcon,
      badge: 'Instant Sharing',
    },
    {
      title: 'Timezone Detection',
      description: 'Automatic guest timezone detection ensures zero confusion across international borders.',
      icon: Globe,
      badge: 'Global',
    },
    {
      title: 'Automated Reminders',
      description: 'Prepare your workflow for automated SMS & email reminders to eliminate meeting no-shows.',
      icon: Bell,
      badge: 'Pro Feature',
    },
  ];

  const steps = [
    {
      step: 'Step 1',
      title: 'Create Your Meeting Type',
      description: 'Specify meeting title, duration, video conference link, and custom booking questions.',
    },
    {
      step: 'Step 2',
      title: 'Set Your Availability',
      description: 'Define when you are open for bookings during the week and set minimum notice rules.',
    },
    {
      step: 'Step 3',
      title: 'Share Your Booking Link',
      description: 'Send your customized link. Guests select an open slot and get instant calendar invitations.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="brand" className="mb-6 py-1 px-3 text-xs">
            ✨ Meetlio 1.0 — Modern Scheduling Platform
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Schedule Meetings Effortlessly. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-600">
              Zero Email Friction.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
            Meetlio gives you total control over your availability, meeting durations, and personal booking links. Simple for you, seamless for your guests.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Get Started Free
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline">
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-brand-500" />
              Setup in under 2 minutes
            </span>
          </div>

          {/* Product Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="p-3 bg-slate-900/90 dark:bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-6 sm:p-8 text-left">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-3 text-xs text-slate-400 font-mono">meetlio.com/alexsmith/30min</span>
                  </div>
                  <span className="text-xs text-brand-400 font-semibold">Live Preview</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Left Column: Host Details */}
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-lg">
                      AS
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Alex Smith</span>
                      <h3 className="text-xl font-bold text-white">30 Minute Strategy Session</h3>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-400" />
                        <span>30 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-400" />
                        <span>Google Meet Video Call</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Calendar Mockup */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                    <div className="text-sm font-semibold text-white mb-3">August 2026</div>
                    <div className="grid grid-cols-7 gap-1 text-[11px] text-slate-400 font-mono mb-2">
                      <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div
                          key={i}
                          className={`p-1.5 rounded-lg text-center font-medium ${
                            i === 14
                              ? 'bg-brand-600 text-white font-bold ring-2 ring-brand-400'
                              : i > 5 && i < 22
                              ? 'bg-slate-800 text-white hover:bg-slate-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Time Slots */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-400 mb-2">Available Slots</div>
                    {['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'].map((slot, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                          idx === 1
                            ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                            : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-brand-500'
                        }`}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything you need for effortless scheduling
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Designed from the ground up for modern freelancers, founders, agency owners, and high-performing teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} hoverEffect className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-2xl">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="neutral">{item.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Simple 3-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">How Meetlio Works</h2>
            <p className="mt-4 text-slate-400 text-base">
              Get up and running in minutes with three easy configuration steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 relative">
                <span className="text-xs font-bold px-3 py-1 bg-brand-600 text-white rounded-full">
                  {s.step}
                </span>
                <h3 className="text-xl font-bold text-white mt-4 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" className="mb-3">
            Pricing Plans
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent plans for everyone
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Start for free and scale as your appointment volume grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="p-8 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free Starter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Perfect for individuals getting started</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$0</span>
                <span className="text-sm text-slate-500 dark:text-slate-400"> / forever</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Active Event Type
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Bookings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Timezone Auto-detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom Booking Link
                </li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </Card>

          {/* Pro Tier */}
          <Card className="p-8 border-2 border-brand-600 relative flex flex-col justify-between shadow-lg">
            <div className="absolute -top-3.5 right-6 bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro Unlimited</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For active professionals & power users</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$12</span>
                <span className="text-sm text-slate-500 dark:text-slate-400"> / month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Event Types
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Calendar Integrations (Google/Outlook)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Email & SMS Reminders
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom Branding & Colors
                </li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8">
              <Button variant="primary" className="w-full">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
