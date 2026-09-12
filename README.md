# Meetlio

> **Effortless, intelligent appointment and meeting scheduling platform for modern professionals and teams.**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Unlicensed-yellow?style=flat-square)](#-license)

Meetlio is a modern full-stack scheduling and appointment management SaaS platform built with the Next.js 15 App Router, React 19, TypeScript, Prisma ORM, and Tailwind CSS. It empowers solo entrepreneurs, consultants, client-facing teams, and businesses to eliminate email back-and-forth by creating shareable scheduling links, setting flexible recurring availability and date overrides, syncing external calendars to prevent double-booking, qualifying invitees via routing forms, collecting upfront payments, and automating booking reminders.

---

## 📖 Table of Contents

- [Introduction](#-introduction)
  - [The Problem Meetlio Solves](#the-problem-meetlio-solves)
  - [Who It Is Designed For](#who-it-is-designed-for)
  - [Core Scheduling Workflow](#core-scheduling-workflow)
  - [Why Meetlio](#why-meetlio)
- [✨ Features](#-features)
  - [Authentication & Accounts](#authentication--accounts)
  - [Scheduling & Event Types](#scheduling--event-types)
  - [Availability Engine & Overrides](#availability-engine--overrides)
  - [Booking Engine & Conflict Prevention](#booking-engine--conflict-prevention)
  - [Meeting Polls & Collective Voting](#meeting-polls--collective-voting)
  - [Routing Forms & Lead Qualification](#routing-forms--lead-qualification)
  - [CRM & Attendee Management](#crm--attendee-management)
  - [Organizations & Multi-User Teams](#organizations--multi-user-teams)
  - [Calendar Integrations & Live Sync](#calendar-integrations--live-sync)
  - [Automated Workflows & Reminders](#automated-workflows--reminders)
  - [Webhooks & Developer APIs](#webhooks--developer-apis)
  - [SaaS Billing & Quota Enforcement](#saas-billing--quota-enforcement)
  - [Analytics & Auditing](#analytics--auditing)
  - [UI & UX Design System](#ui--ux-design-system)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Architecture](#️-database-architecture)
- [🔐 Authentication & Security](#-authentication--security)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running the Development Server](#running-the-development-server)
- [📦 Available Scripts](#-available-scripts)
- [🔄 Core User Workflows](#-core-user-workflows)
- [🧩 Core Modules](#-core-modules)
- [🔌 Implemented API Endpoints](#-implemented-api-endpoints)
- [🎨 UI & Design System](#-ui--design-system)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🏭 Production & Deployment](#-production--deployment)
- [🔄 Git & Synchronization Workflow](#-git--synchronization-workflow)
- [📈 Future Scope](#-future-scope)
- [🐛 Known Limitations](#-known-limitations)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author & Repository](#-author--repository)
- [📸 Screenshots](#-screenshots)

---

## 🌟 Introduction

### The Problem Meetlio Solves
Coordinating appointments across multiple time zones usually requires countless back-and-forth emails, calendar checks, and manual reminders. Last-minute cancellations, double-bookings, and client no-shows cost businesses billable hours. Meetlio solves this by providing a unified, self-hosted or SaaS-ready scheduling hub where hosts define their true availability rules, connect their calendars, and allow clients to self-book available slots instantly.

### Who It Is Designed For
- **Consultants & Advisors:** Book paid or discovery calls with custom intake questions.
- **Freelancers & Agencies:** Share dedicated meeting links for project briefings and client check-ins.
- **Sales & Revenue Teams:** Qualify inbound prospects through routing forms and distribute leads.
- **Customer Success & Support Teams:** Run 1-on-1 onboarding or group training sessions.
- **Growing Organizations:** Centralize team calendars, manage shared event types, and track scheduling metrics.

### Core Scheduling Workflow
1. **Define Rules:** The host sets recurring working hours (with multi-interval support), buffers, notice periods, and date overrides.
2. **Share Link:** The host shares a personalized event URL (`/alexsmith/30min`) or embeds a responsive widget on their website.
3. **Select Slot:** The invitee browses open slots displayed automatically in their local time zone. External busy blocks from Google or Outlook calendars are dynamically subtracted.
4. **Atomic Booking:** The invitee completes the booking form. Meetlio validates availability in an isolated database transaction to eliminate race conditions.
5. **Automation:** Instant calendar invites (`.ics`), email confirmations, webhook dispatches, CRM contact updates, and 24h/1h reminders are executed.

### Why Meetlio
- **Zero Third-Party Booking Dependencies:** Independent scheduling engine with UTC-precise instant calculation.
- **Enterprise-Grade Token Security:** Connected calendar OAuth tokens are encrypted at rest using AES-256-GCM.
- **Modular Monolith Architecture:** Clean division among repositories, services, route handlers, and React Server Components.
- **Database Agility:** Runs locally on SQLite for zero-dependency development and easily scales to PostgreSQL in production through Prisma ORM.

---

## ✨ Features

### Authentication & Accounts
- **Custom Session Engine:** Fully database-backed sessions (`Session` model) with cryptographically random 32-byte session tokens.
- **HttpOnly Cookies:** Session tokens stored securely in `meetlio_session` cookies with `SameSite=Lax`, `Path=/`, and conditional `Secure` flags.
- **Password Security:** Salted password hashing powered by `bcryptjs` with 10 salt rounds.
- **Account Registration:** Email, username, and password signup with automatic default availability schedule generation and initial discovery event types.
- **Password Reset Flow:** Cryptographically secure one-time reset tokens (`PasswordResetToken`) with a 1-hour expiration window.
- **Route Protection:** Server-side route guards (`requireAuth`, `requireGuest`) and Edge middleware (`middleware.ts`) guarding `/app/*` and `/dashboard/*`.
- **Onboarding Pipeline:** User onboarding tracking (`onboardingCompleted` flag) guiding users through workspace setup.
- **User Profile Settings:** Configurable display name, bio, avatar URL, default notice, and booking window rules.

### Scheduling & Event Types
- **Custom Booking URLs:** Host-specific handles and event slugs (`/[username]/[eventSlug]`).
- **Flexible Event Durations:** Configurable durations (15m, 30m, 45m, 60m, custom).
- **Location Types:** Google Meet, Zoom, Microsoft Teams, Phone Call, In-Person Meeting, or Custom Text.
- **Event Kind Architecture:**
  - `ONE_ON_ONE`: Standard single host to single attendee booking.
  - `GROUP`: Multiple attendees per slot with capacity enforcement (`maxAttendees`).
  - `COLLECTIVE`: Multi-host availability intersection (database-backed via `EventTypeHost`).
  - `ROUND_ROBIN`: Host rotation and priority distribution (database-backed via `EventTypeHost.priority`).
- **Buffer Times:** Configurable buffer times before (`bufferBefore`) and after (`bufferAfter`) appointments to prevent back-to-back fatigue.
- **Scheduling Windows & Notice Limits:** Minimum notice period (`minimumNotice` in minutes) and maximum booking window (`maximumBookingWindow` in days).
- **Daily Meeting Limits:** Cap daily bookings to maintain host productivity.
- **Approval Workflows:** Optional manual booking approval requirement (`requireApproval: true`).
- **Event Duplication:** One-click cloning of event types via `POST /api/events/[id]/duplicate`.
- **Intake Questions:** Dynamic question builder supporting `SHORT_TEXT`, `LONG_TEXT`, `PHONE`, `SINGLE_SELECT`, and `MULTI_SELECT`.
- **Embed Code Generator:** Generates production-ready snippets for:
  - Inline Embed (`<iframe>`)
  - Floating Popup Widget
  - Popup Text Link

### Availability Engine & Overrides
- **Weekly Working Hours:** Day-of-week interval schedules (e.g., Monday 09:00–12:00, 13:00–17:00).
- **Multi-Interval Support:** Split shifts and lunch breaks natively supported per day.
- **Date-Specific Overrides:** Explicit date overrides supporting both `AVAILABLE` (special hours) and `UNAVAILABLE` (holidays, time-off).
- **Multi-Schedule Architecture:** Database model `AvailabilitySchedule` enabling multiple named schedules per user with default assignment.
- **Timezone Normalization:** Full UTC instant math with localized projection for host and guest time zones via `date-fns` and `date-fns-tz`.

### Booking Engine & Conflict Prevention
- **Race Condition Protection:** Atomic conflict verification inside a database transaction (`db.$transaction`) to prevent concurrent double-booking.
- **External Busy Subtraction:** Seamlessly subtracts external busy blocks (`ExternalCalendarEvent`) from available slots.
- **Self-Service Rescheduling:** Guests reschedule appointments using cryptographically secure tokens (`rescheduleToken`).
- **Self-Service Cancellations:** Guests or hosts cancel bookings with reason logging (`cancelToken`).
- **Calendar Files:** Direct Google Calendar, Outlook Calendar, and `.ics` download links provided on confirmation pages.
- **Attendance & Status Tracking:** Status tracking for `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, and attendance recording (`ATTENDED`, `NO_SHOW`).
- **CSV Data Export:** Export booking lists to CSV directly via `GET /api/bookings/export?format=csv`.

### Meeting Polls & Collective Voting
- **Time-Slot Polling:** Create multi-slot meeting polls (`MeetingPoll` and `MeetingPollOption`) for group alignment.
- **Public Voting Pages:** Invitees vote on preferred times at `/polls/[pollId]`.
- **Poll Finalization:** Host finalizes the winning time slot via `POST /api/polls/[id]/finalize`, converting the selected option into a confirmed booking.

### Routing Forms & Lead Qualification
- **Intake Routing Forms:** Build qualification forms (`RoutingForm` and `RoutingQuestion`) with dynamic questions.
- **Conditional Routing Rules:** Route responders to specific event types or external URLs based on form answers (`RoutingRule`).
- **Public Responder Experience:** Responsive form interfaces hosted at `/forms/[formId]` and `/r/[slug]`.

### CRM & Attendee Management
- **Automatic Contact Creation:** Every guest booking automatically upserts a record in the `Contact` CRM table.
- **Activity Timeline:** Tracks interaction events in `ContactActivity` (e.g., `BOOKING_CREATED`).
- **Contact Directory:** Search contacts by name, email, or company.
- **Lead Notes:** Dedicated notes field for recording customer context and follow-up details.

### Organizations & Multi-User Teams
- **Organization Workspaces:** Multi-tenant workspace models (`Organization` and `OrganizationMember`).
- **Role-Based Access Control (RBAC):** `OWNER`, `ADMIN`, and `MEMBER` roles.
- **Team Scheduling:** Organization-level event type association, shared bookings, and team collaboration pages (`/app/team`).

### Calendar Integrations & Live Sync
- **Google Calendar Integration:** Real OAuth 2.0 flow (`/api/auth/google`, `/api/auth/google/callback`) with read-only calendar scope.
- **Microsoft Outlook Integration:** Microsoft Graph v2.0 OAuth flow (`/api/auth/outlook`, `/api/auth/outlook/callback`).
- **AES-256-GCM Token Encryption:** Refresh and access tokens are encrypted at rest using PBKDF2 derived keys.
- **Token Refresh Manager:** Automatic token refresh with a 5-minute pre-expiration safety buffer.
- **Live Sync Engine:** Syncs external busy slots into `ExternalCalendarEvent` records for conflict detection.
- **Manual Sync & Disconnect:** On-demand synchronization (`POST /api/calendar/connections/[id]/sync`) and clean disconnect endpoints.
- **Development Simulator:** Graceful fallback simulator when third-party OAuth credentials are not provided.

### Automated Workflows & Reminders
- **Trigger-Action Rules:** Configurable automation workflows (`Workflow` and `WorkflowAction`) triggered on events like `booking.created`.
- **Scheduled 24h & 1h Reminders:** Automated reminder cron engine (`/api/cron/reminders`) with `CRON_SECRET` protection and duplicate-send prevention.
- **In-App Notification Center:** Real-time notifications for hosts (`Notification` model) with unread badge counter.
- **Transactional Emails:** HTML and plain-text templates for confirmations, cancellations, reschedules, and reminders.
- **Nodemailer SMTP Engine:** Production SMTP transport with development console fallback.

### Webhooks & Developer APIs
- **Outbound Webhooks:** Register HTTP endpoints (`WebhookEndpoint`) for booking lifecycle events.
- **Supported Events:** `booking.created`, `booking.cancelled`, `booking.rescheduled`, `booking.completed`, and wildcard `*`.
- **Cryptographic Signatures:** Every webhook payload includes an `X-Meetlio-Signature` header calculated using HMAC-SHA256.
- **Retry Mechanism:** Non-blocking dispatch with 3-attempt exponential backoff retry.
- **Delivery Logging:** Historical tracking of deliveries, HTTP status codes, and payload logs.

### SaaS Billing & Quota Enforcement
- **Plan Tiers:** `FREE`, `PRO`, and `BUSINESS` plans seeded in database (`Plan` model).
- **Usage Tracking:** Monthly usage tracking (`UsageRecord` model) for booking counts, event types, and webhooks.
- **Server-Side Quota Enforcement:** Prevents resource creation when a plan limit is reached (`canCreateBooking`, `canCreateEventType`, `canCreateWebhook`).
- **Subscription Management:** Stripe checkout architecture with dev simulation fallback for local testing.

### Analytics & Auditing
- **Real-Time KPI Metrics:** Total lifetime bookings, completed bookings, cancellation rate (%), and no-show rate (%).
- **Event Popularity Insights:** Breakdown of booking counts and ratios per event type.
- **Comprehensive Audit Logs:** Asynchronous security audit logging (`AuditLog` model) for all key system actions with automated sensitive data scrubbing (passwords, tokens, secret keys).

### UI & UX Design System
- **Responsive Layout:** Mobile-first layout with collapsible sidebar and slide-out mobile navigation drawer.
- **Modern SaaS Aesthetics:** Tailwind CSS styled with an indigo brand palette and slate dark-mode foundations.
- **Reusable Component Library:** Modular UI primitives including Button, Card, Badge, Modal, Alert, Input, Select, Tabs, Skeleton, EmptyState, ConfirmDialog, and CopyButton.
- **Global Search:** Command-palette style global search dialog querying events, bookings, and contacts.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose in Meetlio |
| :--- | :--- | :--- |
| **Next.js** | `15.1.7` | Core full-stack framework (App Router, Server Components, Route Handlers, Server Actions) |
| **React** | `19.0.0` | Declarative user interface library |
| **React DOM** | `19.0.0` | DOM rendering engine for React |
| **TypeScript** | `5.7.3` | End-to-end static type safety, strict compile checks, and path aliasing (`@/*`) |
| **Prisma ORM** | `6.4.0` | Type-safe database client, schema migrations, and relational query builder |
| **SQLite / PostgreSQL** | N/A | SQLite zero-dependency local development engine (`prisma/dev.db`); PostgreSQL production target |
| **Tailwind CSS** | `3.4.17` | Utility-first CSS framework with custom brand colors and dark-mode support |
| **PostCSS** | `8.5.2` | CSS transformation and prefix pipeline |
| **Autoprefixer** | `10.4.20` | Automated vendor prefixing for cross-browser styling |
| **Bcryptjs** | `2.4.3` | Cryptographic password hashing and verification with salt rounds |
| **Node.js Crypto** | *Built-in* | AES-256-GCM token encryption, PBKDF2 key derivation, HMAC-SHA256 signatures, and secure tokens |
| **Zod** | `3.24.2` | Runtime schema definition and request payload validation |
| **date-fns** | `3.6.0` | Modern, modular date manipulation, interval parsing, and ISO string utilities |
| **date-fns-tz** | `3.2.0` | Timezone-aware date calculations and UTC conversions |
| **Lucide React** | `0.475.0` | Production icon system across all dashboard and public pages |
| **clsx** | `2.1.1` | Conditional className composition |
| **tailwind-merge** | `3.0.1` | Conflict-free Tailwind class resolution utility |
| **docx** | `9.7.1` | Word document report generation utility |
| **pdfkit** | `0.20.1` | PDF document export generation utility |
| **ESLint** | `9.20.1` | Code quality and linting rules (`eslint-config-next: 15.1.7`) |

---

## 🏗️ Architecture

Meetlio follows a clean, modular monolith architecture built on Next.js 15 App Router conventions. It cleanly decouples routing, presentation, business services, database persistence, and external integration adapters.

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        Browser["Web Browser (Desktop / Mobile)"]
        PublicWidget["Embedded Public Widget"]
    end

    subgraph Edge ["Routing & Security Layer"]
        Middleware["Edge Middleware (middleware.ts)\nSession Validation & Legacy Redirects"]
        RateLimiter["In-Memory Sliding Window Rate Limiter"]
    end

    subgraph AppRouter ["Next.js App Router (app/)"]
        AuthPages["(auth) Pages\nLogin, Signup, Reset Password"]
        MarketingPages["(marketing) Pages\nLanding Page, Pricing"]
        DashboardPages["app/ Dashboard Pages\nScheduling, Availability, Meetings, CRM"]
        PublicPages["[username] Booking Pages\nSlot Selection, Intake Form, Confirmation"]
        APIRoutes["Route Handlers (app/api/*)\nREST APIs & Cron Endpoints"]
    end

    subgraph ServiceLayer ["Business Logic & Services (lib/ & server/)"]
        AuthService["Auth & Session Manager\n(lib/auth/session.ts)"]
        SlotEngine["Slot Generation & Conflict Engine\n(lib/scheduling/slots.ts)"]
        BookingService["Atomic Booking Coordinator\n(app/api/public/.../book)"]
        CalendarSync["OAuth & Calendar Sync Engine\n(lib/integrations/calendar-sync.ts)"]
        TokenCrypto["AES-256-GCM Token Encryption\n(lib/integrations/token-encryption.ts)"]
        BillingService["Billing & Usage Quota Guard\n(lib/billing/usage.ts)"]
        WebhookService["HMAC-SHA256 Webhook Dispatcher\n(lib/webhooks/service.ts)"]
        EmailService["Nodemailer & Reminder Engine\n(lib/email/service.ts)"]
        AuditService["Security Audit Logger\n(lib/audit/service.ts)"]
    end

    subgraph DataLayer ["Persistence Layer"]
        PrismaClient["Prisma ORM Client\n(lib/db/prisma.ts)"]
        Database[("Database\nSQLite (Local) / PostgreSQL (Prod)")]
    end

    subgraph ExternalServices ["External Systems"]
        GoogleOAuth["Google Calendar API"]
        OutlookOAuth["Microsoft Graph API"]
        SMTPGateway["SMTP Email Gateway / Resend"]
        WebhookReceivers["Third-Party Webhook Endpoints"]
    end

    Browser --> Middleware
    PublicWidget --> Middleware
    Middleware --> RateLimiter
    RateLimiter --> AppRouter

    AuthPages --> AuthService
    DashboardPages --> PrismaClient
    PublicPages --> SlotEngine
    APIRoutes --> ServiceLayer

    SlotEngine --> CalendarSync
    BookingService --> PrismaClient
    BookingService --> WebhookService
    BookingService --> EmailService
    BookingService --> AuditService
    BookingService --> BillingService
    CalendarSync --> TokenCrypto

    ServiceLayer --> PrismaClient
    PrismaClient --> Database

    CalendarSync --> GoogleOAuth
    CalendarSync --> OutlookOAuth
    EmailService --> SMTPGateway
    WebhookService --> WebhookReceivers
```

### Communication Flow
1. **Request Ingestion:** Requests pass through `middleware.ts`, which validates session cookies for `/app/*` and `/dashboard/*` routes and redirects legacy URLs to modern `/app/*` equivalents.
2. **Server Components:** Data fetching occurs directly in React Server Components via the singleton Prisma client (`lib/db/prisma.ts`), eliminating redundant HTTP round trips.
3. **Client Components:** Interactive forms, modals, tabs, and real-time inputs invoke REST route handlers under `app/api/*`.
4. **Service & Repository Layer:** Reusable domain logic (availability calculations, token refresh, audit logging) is encapsulated in `lib/` and `server/services/`.
5. **Persistence:** All mutations pass through Prisma ORM models with strict relational constraints and transaction rollback guarantees.

---

## 📁 Project Structure

```text
meetlio/
├── app/                                # Next.js App Router root
│   ├── (auth)/                         # Authentication route group
│   │   ├── forgot-password/            # Password reset request page
│   │   ├── login/                      # User authentication login page
│   │   ├── reset-password/             # Token-verified password reset page
│   │   └── signup/                     # User registration page
│   ├── (marketing)/                    # Marketing landing pages
│   │   ├── layout.tsx                  # Public marketing layout
│   │   └── page.tsx                    # SaaS landing page with hero & features
│   ├── [username]/                     # Public booking domain
│   │   ├── [eventSlug]/                # Event booking page & slot picker
│   │   │   ├── confirmation/           # Post-booking confirmation screen
│   │   │   └── page.tsx                # Interactive 3-column booking interface
│   │   └── page.tsx                    # Public host profile & event directory
│   ├── api/                            # REST API Route Handlers
│   │   ├── audit-logs/                 # Audit trail inspection endpoint
│   │   ├── auth/                       # Credentials & OAuth handlers
│   │   ├── availability/               # Weekly schedules & date overrides
│   │   ├── billing/                    # Stripe checkout & subscription management
│   │   ├── bookings/                   # Booking management, approvals, exports
│   │   ├── calendar/                   # External calendar connections & sync
│   │   ├── cron/                       # Scheduled tasks (24h/1h reminders)
│   │   ├── events/                     # Event type CRUD, duplication, analytics
│   │   ├── forms/                      # Routing forms CRUD & submission
│   │   ├── polls/                      # Meeting polls voting & finalization
│   │   ├── public/                     # Unauthenticated public booking APIs
│   │   ├── routing/                    # Routing engine redirects
│   │   ├── search/                     # Global command-palette search
│   │   ├── user/                       # Profile, onboarding, password change
│   │   ├── webhooks/                   # Webhook endpoint management
│   │   └── workflows/                  # Automation workflow management
│   ├── app/                            # Authenticated application workspace
│   │   ├── analytics/                  # Scheduling analytics & metrics dashboard
│   │   ├── availability/               # Working hours & date override editor
│   │   ├── contacts/                   # CRM directory & attendee details
│   │   │   └── [id]/                   # Individual contact activity timeline
│   │   ├── integrations/               # Connected calendar apps & OAuth directory
│   │   ├── layout.tsx                  # Authenticated workspace shell layout
│   │   ├── meetings/                   # Scheduled meetings management
│   │   │   └── [id]/                   # Meeting detail & management page
│   │   ├── page.tsx                    # Dashboard home (KPIs, agenda, quick links)
│   │   ├── payments/                   # Revenue metrics & paid booking records
│   │   ├── routing/                    # Routing form management dashboard
│   │   ├── scheduling/                 # Event type manager & share/embed modals
│   │   │   ├── new/                    # Event type creation wizard
│   │   │   ├── one-off/                # One-off instant meeting creator
│   │   │   └── polls/                  # Meeting poll creation wizard
│   │   ├── settings/                   # Profile, security, and scheduling defaults
│   │   ├── team/                       # Organization & multi-user team dashboard
│   │   └── workflows/                  # Automated email & reminder workflow rules
│   ├── booking/                        # Alternative booking routes
│   ├── cancel/[token]/                 # Self-service booking cancellation page
│   ├── dashboard/                      # Legacy dashboard routes (redirected via middleware)
│   ├── forms/[formId]/                 # Public routing form responder page
│   ├── onboarding/                     # New user onboarding wizard
│   ├── polls/[pollId]/                 # Public meeting poll voting page
│   ├── pricing/                        # Public SaaS subscription pricing page
│   ├── r/[slug]/                       # Short routing redirect handler
│   ├── reschedule/[token]/             # Self-service booking reschedule page
│   ├── globals.css                     # Global Tailwind directives & variables
│   └── layout.tsx                      # Root HTML layout & font declarations
├── components/                         # Reusable UI & presentation components
│   ├── booking/                        # Public booking form & slot pickers
│   ├── brand/                          # Logo and brand mark components
│   ├── dashboard/                      # Dashboard cards, charts, and grids
│   ├── layout/                         # DashboardShell, Sidebar, TopNav, Footer
│   ├── notifications/                  # In-app notification center dropdown
│   ├── search/                         # Global search modal dialog
│   └── ui/                             # Primitives: Button, Card, Modal, Input, Badge, etc.
├── lib/                                # Core domain libraries & shared helpers
│   ├── audit/                          # Audit log recording service
│   ├── auth/                           # Sessions, bcrypt passwords, route guards, tokens
│   ├── billing/                        # Plan seeds, usage tracking, quota enforcement
│   ├── db/                             # Prisma client singleton instance
│   ├── email/                          # Nodemailer transport & HTML email templates
│   ├── integrations/                   # Google/Outlook OAuth, token encryption, live sync
│   ├── scheduling/                     # Slot calculation, conflict detection, timezones
│   ├── timezone/                       # Timezone database options & helpers
│   ├── validation/                     # Zod request validation schemas
│   ├── webhooks/                       # HMAC webhook delivery & retry service
│   ├── api-response.ts                 # Standardized JSON response formatting helpers
│   ├── env.ts                          # Strict environment variable parser
│   └── rate-limit.ts                   # In-memory sliding window rate limiter
├── prisma/                             # Database configuration & seeding
│   ├── dev.db                          # Local development SQLite database
│   ├── schema.prisma                   # Canonical Prisma database schema
│   ├── schema.sqlite.prisma            # SQLite schema reference
│   ├── seed.js                         # Compiled JavaScript database seeder
│   └── seed.ts                         # TypeScript database seeder script
├── scripts/                            # Operational & documentation scripts
├── server/                             # Server repositories & domain services
│   ├── repositories/                   # Data access repositories (Booking, Event, User)
│   └── services/                       # Domain services (Availability, Booking, Event)
├── types/                              # Global TypeScript interfaces & scheduling types
├── auto-git-sync.ps1                   # Automated PowerShell GitHub sync watcher
├── middleware.ts                       # Next.js Edge route guard & redirect middleware
├── next.config.mjs                     # Next.js build & runtime configuration
├── package.json                        # Project dependencies, metadata, and npm scripts
├── postcss.config.mjs                  # PostCSS plugins configuration
├── tailwind.config.ts                  # Tailwind theme, colors, and content rules
└── tsconfig.json                       # TypeScript compiler options
```

---

## 🗄️ Database Architecture

Meetlio uses **Prisma ORM** with a comprehensive relational schema. While configured with an embedded **SQLite** engine (`file:./dev.db`) for zero-dependency local development, the schema is 100% compatible with **PostgreSQL** for production environments.

### Core Database Models

| Model | Purpose | Primary Key | Key Foreign Keys & Relations | Key Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **`User`** | Platform user, host, or attendee account | `id` (CUID) | Owns `Organization`, `EventType`, `Booking`, `Availability`, `Session` | `email` (unique), `username` (unique) |
| **`Session`** | Server-side user login session | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `sessionToken` (unique) |
| **`Organization`** | Multi-tenant team workspace | `id` (CUID) | `ownerId` $\rightarrow$ `User.id` (Cascade) | `slug` (unique) |
| **`OrganizationMember`** | User membership and role within an organization | `id` (CUID) | `organizationId` $\rightarrow$ `Organization.id`, `userId` $\rightarrow$ `User.id` | Unique `[organizationId, userId]` |
| **`PasswordResetToken`** | Secure token for password reset | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `tokenHash` (unique) |
| **`AvailabilitySchedule`** | Named schedule containing working hours | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | Has many `Availability`, `EventType` |
| **`Availability`** | Weekly day-of-week working hours interval | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `scheduleId` $\rightarrow$ `AvailabilitySchedule.id` | `dayOfWeek` (0-6), `startTime`, `endTime` |
| **`AvailabilityOverride`** | Date-specific availability override | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `date`, `type` (`AVAILABLE` / `UNAVAILABLE`) |
| **`EventType`** | Meeting configuration template (duration, rules) | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `scheduleId` $\rightarrow$ `AvailabilitySchedule.id` | Unique `[userId, slug]` |
| **`EventTypeHost`** | Host assignment for collective or round-robin events | `id` (CUID) | `eventTypeId` $\rightarrow$ `EventType.id`, `userId` $\rightarrow$ `User.id` | Unique `[eventTypeId, userId]` |
| **`EventBookingQuestion`** | Custom intake question on booking page | `id` (CUID) | `eventTypeId` $\rightarrow$ `EventType.id` (Cascade) | `order`, `type`, `isRequired` |
| **`Booking`** | Confirmed or pending appointment record | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `eventTypeId` $\rightarrow$ `EventType.id` | `cancelToken` (unique), `rescheduleToken` (unique) |
| **`BookingAnswer`** | Attendee answer to custom booking question | `id` (CUID) | `bookingId` $\rightarrow$ `Booking.id`, `questionId` $\rightarrow$ `EventBookingQuestion.id` | Cascades on `Booking` delete |
| **`BookingInvitee`** | Additional guest email invited to meeting | `id` (CUID) | `bookingId` $\rightarrow$ `Booking.id` (Cascade) | Linked to meeting |
| **`CalendarConnection`** | Connected Google or Outlook account | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | Unique `[userId, provider]` |
| **`ConnectedCalendar`** | Specific calendar selected for read/write | `id` (CUID) | `calendarConnectionId` $\rightarrow$ `CalendarConnection.id` | External calendar ID |
| **`ExternalCalendarEvent`** | External busy block synced from third party | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `connectionId` $\rightarrow$ `CalendarConnection.id` | `startTime`, `endTime`, `externalId` |
| **`Contact`** | CRM contact generated from bookings | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `organizationId` $\rightarrow$ `Organization.id` | Unique `[userId, email]` |
| **`ContactActivity`** | Historical event recorded for a contact | `id` (CUID) | `contactId` $\rightarrow$ `Contact.id` (Cascade) | `type`, `metadata` |
| **`Workflow`** | Automated trigger-action workflow | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `trigger` (e.g. `booking.created`) |
| **`WorkflowAction`** | Specific action executed by a workflow | `id` (CUID) | `workflowId` $\rightarrow$ `Workflow.id` (Cascade) | `actionType`, `type`, `order` |
| **`MeetingPoll`** | Group meeting time polling container | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `isFinalized`, `finalizedSlot` |
| **`MeetingPollOption`** | Proposed time window in a meeting poll | `id` (CUID) | `pollId` $\rightarrow$ `MeetingPoll.id` (Cascade) | `startTime`, `endTime` |
| **`MeetingPollVote`** | Attendee vote on a poll option | `id` (CUID) | `pollId` $\rightarrow$ `MeetingPoll.id`, `optionId` $\rightarrow$ `MeetingPollOption.id` | Unique `[pollId, optionId, voterEmail]` |
| **`RoutingForm`** | Qualification form container | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `slug` (unique) |
| **`RoutingRule`** | Conditional routing logic | `id` (CUID) | `routingFormId` $\rightarrow$ `RoutingForm.id` (Cascade) | `conditionField`, `destinationType` |
| **`Payment`** | Paid booking transaction record | `id` (CUID) | `userId` $\rightarrow$ `User.id`, `bookingId` $\rightarrow$ `Booking.id` | `amount`, `currency`, `status` |
| **`Notification`** | In-app user notification | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade), `bookingId` $\rightarrow$ `Booking.id` | `read` (boolean), `type` |
| **`WebhookEndpoint`** | Destination URL for outbound event notifications | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `url`, `secret`, `events` |
| **`WebhookDelivery`** | Log of webhook dispatch attempt | `id` (CUID) | `webhookId` $\rightarrow$ `WebhookEndpoint.id` (Cascade) | `responseCode`, `attempts`, `status` |
| **`AuditLog`** | Security and compliance audit trail | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | `action`, `entityType`, `metadata` |
| **`Plan`** | SaaS subscription tier configuration | `id` (CUID) | Referenced by `Subscription` | `slug` (unique), limits & prices |
| **`Subscription`** | User's active SaaS subscription | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade), `planId` $\rightarrow$ `Plan.id` | `userId` (unique) |
| **`UsageRecord`** | Monthly resource consumption counter | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | Unique `[userId, month]` |
| **`BookingTag`** | Label/category tag for bookings | `id` (CUID) | `userId` $\rightarrow$ `User.id` (Cascade) | Unique `[userId, name]` |

### Database Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Organization : owns
    User ||--o{ OrganizationMember : belongs_to
    User ||--o{ EventType : creates
    User ||--o{ AvailabilitySchedule : configures
    User ||--o{ Availability : defines
    User ||--o{ AvailabilityOverride : overrides
    User ||--o{ Booking : receives
    User ||--o{ CalendarConnection : connects
    User ||--o{ ExternalCalendarEvent : syncs
    User ||--o{ Contact : manages
    User ||--o{ Workflow : automates
    User ||--o{ MeetingPoll : organizes
    User ||--o{ RoutingForm : creates
    User ||--o{ WebhookEndpoint : subscribes
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : generates
    User ||--o| Subscription : maintains
    User ||--o{ UsageRecord : accumulates

    Organization ||--o{ OrganizationMember : contains
    Organization ||--o{ EventType : owns
    Organization ||--o{ Booking : tracks

    AvailabilitySchedule ||--o{ Availability : contains
    AvailabilitySchedule ||--o{ EventType : applies_to

    EventType ||--o{ Booking : generates
    EventType ||--o{ EventBookingQuestion : asks
    EventType ||--o{ EventTypeHost : assigns

    Booking ||--o{ BookingAnswer : includes
    Booking ||--o{ BookingInvitee : invites
    Booking ||--o{ Payment : bills
    Booking ||--o{ Notification : triggers

    CalendarConnection ||--o{ ConnectedCalendar : manages
    CalendarConnection ||--o{ ExternalCalendarEvent : supplies

    Contact ||--o{ ContactActivity : logs

    Workflow ||--o{ WorkflowAction : executes
    MeetingPoll ||--o{ MeetingPollOption : offers
    MeetingPollOption ||--o{ MeetingPollVote : gathers

    RoutingForm ||--o{ RoutingQuestion : includes
    RoutingForm ||--o{ RoutingRule : evaluates

    WebhookEndpoint ||--o{ WebhookDelivery : records
    Plan ||--o{ Subscription : defines
```

---

## 🔐 Authentication & Security

Meetlio is engineered with defense-in-depth security principles:

1. **Password Hashing:** Passwords are never stored in plaintext. They are hashed using `bcryptjs` with 10 salt rounds (`lib/auth/password.ts`).
2. **Session Integrity:** Sessions are persisted directly in the database (`Session` model). The session token is a cryptographically strong 32-byte hexadecimal string generated via Node.js `crypto.randomBytes(32)`.
3. **Cookie Hardening:** Session cookies are set with:
   - `HttpOnly: true` (prevents JavaScript access and XSS token theft)
   - `SameSite: "lax"` (mitigates CSRF attacks)
   - `Secure: true` in production environments
   - `Path: "/"`
   - Automatic deletion on logout or expiration
4. **Token Encryption at Rest:** External OAuth tokens (`accessToken`, `refreshToken`) for Google and Microsoft are encrypted using **AES-256-GCM** with unique initialization vectors (IVs) and PBKDF2-derived keys (`lib/integrations/token-encryption.ts`).
5. **OAuth State Verification:** OAuth initiation creates a cryptographically random `state` parameter saved in a 10-minute HttpOnly cookie to protect against OAuth CSRF interception.
6. **Webhook Signature Verification:** Outbound webhook requests carry an `X-Meetlio-Signature` header calculated using HMAC-SHA256 with the endpoint's private secret.
7. **Rate Limiting:** Public endpoints are protected by an in-memory sliding window rate limiter (`lib/rate-limit.ts`) inspecting client IP addresses (`x-forwarded-for`, `x-real-ip`).
8. **Sensitive Parameter Scrubbing:** The security audit logging service (`lib/audit/service.ts`) systematically deletes sensitive fields (`password`, `passwordHash`, `currentPassword`, `newPassword`, `sessionToken`, `token`, `secret`, `secretKey`, `billingSecret`) before writing logs to the database.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.17.0 or v20.x+ (Tested on Node.js v20.18.0)
- **npm:** v9.x or v10.x+
- **Git:** Installed and configured

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aizaz-01/Meetlio.git
   cd Meetlio
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the project root:

**On Linux / macOS:**
```bash
cp .env.example .env
```

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

#### Environment Variables Reference

| Variable Name | Required | Default / Example Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `file:./dev.db` | Database connection string. Use SQLite for local development or PostgreSQL for production. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `http://localhost:3000` | Fully qualified base URL of the Meetlio instance. |
| `SESSION_SECRET` | **Yes** | *Min 32-character secret* | Secret used for session generation and hashing integrity. |
| `ENCRYPTION_KEY` | Optional | *32-byte secret* | Key used for AES-256-GCM token encryption for calendar OAuth integrations. |
| `GOOGLE_CLIENT_ID` | Optional | `your_google_client_id` | Google Cloud OAuth 2.0 Client ID for Google Calendar sync. |
| `GOOGLE_CLIENT_SECRET` | Optional | `your_google_client_secret` | Google Cloud OAuth 2.0 Client Secret. |
| `GOOGLE_REDIRECT_URI` | Optional | `http://localhost:3000/api/auth/google/callback` | OAuth callback redirect URL registered in Google Cloud Console. |
| `MICROSOFT_CLIENT_ID` | Optional | `your_azure_client_id` | Microsoft Azure App Registration Client ID for Outlook Calendar sync. |
| `MICROSOFT_CLIENT_SECRET` | Optional | `your_azure_client_secret` | Microsoft Azure App Registration Client Secret. |
| `MICROSOFT_REDIRECT_URI` | Optional | `http://localhost:3000/api/auth/outlook/callback` | OAuth callback redirect URL registered in Microsoft Azure Portal. |
| `STRIPE_SECRET_KEY` | Optional | `sk_test_...` | Stripe secret key for live payment processing. Defaults to Dev Simulator when omitted. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | `pk_test_...` | Stripe publishable key for client-side checkout. |
| `SMTP_HOST` | Optional | `smtp.example.com` | SMTP relay hostname for transactional emails. Uses console log fallback when omitted. |
| `SMTP_PORT` | Optional | `587` | SMTP relay port (587 for TLS, 465 for SSL). |
| `SMTP_USER` | Optional | `smtp-user` | SMTP authentication username. |
| `SMTP_PASSWORD` | Optional | `smtp-password` | SMTP authentication password. |
| `EMAIL_FROM` | Optional | `no-reply@meetlio.com` | Sender address appearing on transactional emails. |
| `CRON_SECRET` | Optional | `your_secure_cron_secret` | Secret bearer token required to trigger `/api/cron/reminders`. |
| `ENABLE_INTEGRATION_SIMULATOR` | Optional | `true` | Allows local development calendar sync simulation when OAuth credentials are absent. |

### Database Setup & Seeding

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Push Schema to Database:**
   ```bash
   npm run prisma:db-push
   ```

3. **Seed Initial Demo Data (Optional):**
   ```bash
   node prisma/seed.js
   ```
   *The seeder provisions a demo host account:*
   - **Email:** `alex@meetlio.com`
   - **Password:** `meetlio123`
   - **Username:** `alexsmith`
   - **Pre-configured:** 3 Event Types (30min, 15min, 60min), default working hours, sample contacts, and bookings.

### Running the Development Server

Start the local development server:
```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 📦 Available Scripts

All scripts defined in `package.json`:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `http://localhost:3000` with hot module reloading. |
| `npm run build` | Compiles the TypeScript application and builds the optimized Next.js production bundle. |
| `npm run start` | Launches the built production Next.js server. |
| `npm run lint` | Runs ESLint 9 against all TypeScript, TSX, and JavaScript source files. |
| `npm run prisma:generate` | Generates the type-safe `@prisma/client` from `prisma/schema.prisma`. |
| `npm run prisma:db-push` | Synchronizes the database schema directly with the Prisma schema without migration files. |

---

## 🔄 Core User Workflows

```mermaid
sequenceDiagram
    autonumber
    actor Host as Host (User)
    actor Invitee as Invitee (Client)
    participant App as Meetlio Web App
    participant Engine as Scheduling Engine
    participant DB as Prisma / Database
    participant External as External Calendar / Webhook

    Host->>App: 1. Sign up & define working hours
    App->>DB: Save availability & event types
    Host->>Invitee: 2. Share booking link (/alexsmith/30min)
    Invitee->>App: 3. Browse link & pick date
    App->>Engine: 4. Request available slots for date
    Engine->>DB: Fetch host working hours & existing bookings
    Engine->>External: Fetch external calendar busy blocks
    Engine-->>App: 5. Return available slots in invitee timezone
    Invitee->>App: 6. Select slot & submit details / answers
    App->>DB: 7. Atomic transaction (hasTimeConflict verification)
    Note over App,DB: If concurrent conflict occurs, roll back with 409
    DB-->>App: Booking created (status: CONFIRMED)
    App->>External: 8. Trigger outbound webhooks & calendar sync
    App->>DB: 9. Upsert Contact CRM & create host notification
    App-->>Invitee: 10. Render confirmation screen & .ics download
```

### Detailed Workflow Stages
1. **Host Setup:** Host registers, configures weekly recurring intervals (e.g. Mon–Fri 09:00–17:00), and creates event types with specific durations, locations, and intake questions.
2. **Link Distribution:** Host shares their booking URL (`/[username]/[eventSlug]`) or embeds the widget into their website.
3. **Availability Projection:** When an invitee opens the page, the scheduling engine calculates valid slots for the selected date by evaluating weekly availability, subtracting date overrides, existing bookings, and third-party calendar busy slots.
4. **Race-Condition-Proof Booking:** When the invitee confirms a slot, the server executes an atomic database transaction. If two invitees submit the same slot simultaneously, the transaction-level conflict check detects the collision and safely rejects the second request with a `409 Conflict`.
5. **Post-Booking Automation:** Meetlio triggers confirmation emails, schedules 24h and 1h reminders, logs the interaction in the CRM, dispatches signed webhooks, and writes an audit log.

---

## 🧩 Core Modules

### 1. Authentication & Session Module (`lib/auth/`)
- **Responsibility:** Manages password hashing (`password.ts`), server session creation/destruction (`session.ts`), one-time reset tokens (`tokens.ts`), and route guards (`guards.ts`).
- **Integration:** Invoked by route handlers under `app/api/auth/` and Server Components in `app/app/`.

### 2. Scheduling & Slot Calculation Engine (`lib/scheduling/`)
- **Responsibility:** Core time math engine (`slots.ts`, `availability.ts`, `conflicts.ts`, `timezone.ts`). Computes candidate intervals, applies minimum notice, maximum booking windows, buffer times, date overrides, and external busy slots.
- **Integration:** Powers public availability endpoints (`/api/public/[username]/[eventSlug]/availability`) and server-side booking validation.

### 3. Calendar Synchronization & OAuth Subsystem (`lib/integrations/`)
- **Responsibility:** Handles Google and Microsoft OAuth flows, encrypts/decrypts tokens via AES-256-GCM (`token-encryption.ts`), refreshes expired tokens (`token-manager.ts`), and syncs external busy events (`calendar-sync.ts`).
- **Integration:** Feeds `ExternalCalendarEvent` records into the slot generation pipeline to prevent double-booking.

### 4. Workflows & Notifications Engine (`lib/email/`, `app/api/cron/`)
- **Responsibility:** Executes automation rules (`Workflow`), delivers transactional emails via Nodemailer (`service.ts`, `templates.ts`), runs scheduled reminders (`cron/reminders`), and manages in-app notifications.
- **Integration:** Triggered on booking creation, cancellation, and scheduled cron jobs.

### 5. Webhook Dispatcher (`lib/webhooks/`)
- **Responsibility:** Dispatches JSON payloads for booking lifecycle events to user-configured webhook endpoints with HMAC-SHA256 signatures (`X-Meetlio-Signature`) and 3-attempt exponential backoff.
- **Integration:** Invoked asynchronously during booking creation, rescheduling, and cancellation.

### 6. Billing & Quota Enforcement Subsystem (`lib/billing/`)
- **Responsibility:** Tracks monthly resource usage (`usage.ts`), enforces plan quotas before bookings or event types are created, and seeds subscription plans (`seed-plans.ts`).
- **Integration:** Intercepts booking and event creation requests to ensure compliance with plan limits.

### 7. Routing Forms & Meeting Polls Subsystems (`app/api/forms/`, `app/api/polls/`)
- **Responsibility:** Provides lead qualification and meeting polling. Routes invitees based on question answers, and collects attendee votes on candidate meeting times.
- **Integration:** Directly links into event booking URLs upon form qualification or poll finalization.

---

## 🔌 Implemented API Endpoints

| HTTP Method | Route / Endpoint | Auth Required | Purpose & Description | Request Body / Parameters | Response Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register a new user account and set session cookie | `{ name, email, username, password, timezone }` | `201 Created` / `400` |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue session cookie | `{ email, password }` | `200 OK` / `401` |
| `POST` | `/api/auth/logout` | Authenticated | Destroy current session and clear cookie | None | `200 OK` |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile | None | `200 OK` / `401` |
| `POST` | `/api/auth/forgot-password`| Public | Generate password reset token | `{ email }` | `200 OK` / `400` |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid token | `{ token, password }` | `200 OK` / `400` |
| `GET` | `/api/auth/google` | Authenticated | Initiate Google OAuth flow for calendar sync | Query: `redirect` | `307 Redirect` |
| `GET` | `/api/auth/google/callback` | Authenticated | Exchange Google auth code for encrypted tokens | Query: `code`, `state` | `307 Redirect` |
| `GET` | `/api/auth/outlook` | Authenticated | Initiate Microsoft Outlook OAuth flow | Query: `redirect` | `307 Redirect` |
| `GET` | `/api/auth/outlook/callback`| Authenticated | Exchange Microsoft code for tokens | Query: `code`, `state` | `307 Redirect` |
| `GET` | `/api/availability` | Authenticated | Fetch current user's weekly working intervals | None | `200 OK` |
| `POST` | `/api/availability` | Authenticated | Save / update weekly working intervals | `Array<{ dayOfWeek, startTime, endTime, isActive }>` | `200 OK` |
| `GET` | `/api/availability/overrides`| Authenticated | List all date-specific availability overrides | None | `200 OK` |
| `POST` | `/api/availability/overrides`| Authenticated | Create a date-specific override | `{ date, type, startTime?, endTime? }` | `201 Created` |
| `DELETE`| `/api/availability/overrides/[id]`| Authenticated | Remove a date-specific override | Path: `id` | `200 OK` |
| `GET` | `/api/events` | Authenticated | List all event types for current user | None | `200 OK` |
| `POST` | `/api/events` | Authenticated | Create a new event type | `{ name, slug, duration, locationType, ... }` | `201 Created` |
| `GET` | `/api/events/[id]` | Authenticated | Get detailed configuration of an event type | Path: `id` | `200 OK` |
| `PUT` | `/api/events/[id]` | Authenticated | Update event type configuration | Partial event type fields | `200 OK` |
| `DELETE`| `/api/events/[id]` | Authenticated | Delete an event type | Path: `id` | `200 OK` |
| `POST` | `/api/events/[id]/duplicate`| Authenticated | Clone an existing event type | Path: `id` | `201 Created` |
| `GET` | `/api/events/analytics` | Authenticated | Fetch aggregated booking analytics per event type | None | `200 OK` |
| `GET` | `/api/bookings` | Authenticated | List user bookings with status filter & pagination | Query: `status`, `page`, `limit` | `200 OK` |
| `GET` | `/api/bookings/export` | Authenticated | Export bookings as downloadable CSV | Query: `format=csv` | `200 OK (text/csv)` |
| `POST` | `/api/bookings/[id]/approve`| Authenticated | Approve a pending booking request | Path: `id` | `200 OK` |
| `POST` | `/api/bookings/[id]/reject` | Authenticated | Reject a pending booking request | Path: `id`, Body: `{ reason? }` | `200 OK` |
| `POST` | `/api/bookings/[id]/attendance`| Authenticated | Record attendee attendance status | Path: `id`, Body: `{ attendance: "ATTENDED"|"NO_SHOW" }` | `200 OK` |
| `GET` | `/api/calendar/connections` | Authenticated | List connected external calendar integrations | None | `200 OK` |
| `POST` | `/api/calendar/connections/[id]/sync`| Authenticated| Trigger immediate sync of external calendar events | Path: `id` | `200 OK` |
| `DELETE`| `/api/calendar/connections/[id]`| Authenticated | Disconnect calendar and purge synced events | Path: `id` | `200 OK` |
| `GET` | `/api/cron/reminders` | Secret Header | Execute scheduled 24h and 1h email reminders | Header: `x-cron-secret` or Query: `secret` | `200 OK` |
| `GET` | `/api/webhooks` | Authenticated | List registered outbound webhook endpoints | None | `200 OK` |
| `POST` | `/api/webhooks` | Authenticated | Register a new outbound webhook endpoint | `{ url, secret, events }` | `201 Created` |
| `DELETE`| `/api/webhooks/[id]` | Authenticated | Delete a webhook endpoint | Path: `id` | `200 OK` |
| `GET` | `/api/workflows` | Authenticated | List automated email & notification workflows | None | `200 OK` |
| `POST` | `/api/workflows` | Authenticated | Create a new workflow rule | `{ name, trigger, actions: [...] }` | `201 Created` |
| `DELETE`| `/api/workflows/[id]` | Authenticated | Delete a workflow rule | Path: `id` | `200 OK` |
| `GET` | `/api/polls` | Authenticated | List meeting polls created by current user | None | `200 OK` |
| `POST` | `/api/polls` | Authenticated | Create a new group meeting poll | `{ title, description, duration, options: [...] }` | `201 Created` |
| `POST` | `/api/polls/[id]/vote` | Public | Cast vote for proposed poll options | `{ voterName, voterEmail, optionIds: [...] }` | `200 OK` |
| `POST` | `/api/polls/[id]/finalize`| Authenticated | Finalize winning time slot in a poll | `{ optionId }` | `200 OK` |
| `GET` | `/api/forms` | Authenticated | List routing forms | None | `200 OK` |
| `POST` | `/api/forms` | Authenticated | Create a new routing form with rules | `{ title, description, rules: [...] }` | `201 Created` |
| `POST` | `/api/forms/[id]/submit` | Public | Submit answers to routing form & receive redirect URL | `{ answers: Record<string, any> }` | `200 OK` |
| `GET` | `/api/search` | Authenticated | Global search across events, bookings, and contacts | Query: `q` | `200 OK` |
| `GET` | `/api/billing/subscription`| Authenticated | Get current subscription and quota usage | None | `200 OK` |
| `POST` | `/api/billing/checkout` | Authenticated | Create checkout session for plan upgrade | `{ planSlug, interval: "monthly"|"yearly" }` | `200 OK` |
| `POST` | `/api/user/profile` | Authenticated | Update user profile settings | `{ name, bio, timezone, avatarUrl }` | `200 OK` |
| `POST` | `/api/user/change-password`| Authenticated | Change user account password | `{ currentPassword, newPassword }` | `200 OK` |
| `POST` | `/api/user/onboarding` | Authenticated | Complete initial onboarding steps | `{ username, timezone, scheduleName }` | `200 OK` |
| `GET` | `/api/public/[username]/[eventSlug]/availability`| Public | Fetch calculated available slots for date | Query: `date`, `guestTimezone` | `200 OK` |
| `POST` | `/api/public/[username]/[eventSlug]/book`| Public | Atomically book a selected appointment slot | `{ startTime, guestName, guestEmail, guestTimezone, answers }` | `201 Created` / `409` |
| `POST` | `/api/public/bookings/cancel` | Public (Token) | Cancel booking using secure token | `{ token, reason? }` | `200 OK` |
| `POST` | `/api/public/bookings/reschedule`| Public (Token) | Reschedule booking to a new time using secure token | `{ token, newStartTime }` | `200 OK` |
| `GET` | `/api/public/bookings/[token]/calendar`| Public (Token)| Download `.ics` iCalendar file for confirmed booking | Path: `token` | `200 OK (text/calendar)` |

---

## 🎨 UI & Design System

Meetlio’s user interface is built with Tailwind CSS following modern SaaS design conventions:

- **Color Palette:**
  - **Brand Colors:** Tailored Indigo (`brand-50` through `brand-950`), centered on `#6366f1` (`brand-500`) and `#4f46e5` (`brand-600`).
  - **Neutral Bases:** Crisp slate and zinc scales with deep background accents (`#141c2e` and `#0b0f19`) for dark mode.
- **Typography:** Configured to use system font stacks (`system-ui`, `-apple-system`, `sans-serif`) optimized for readability across devices.
- **Component Primitives (`components/ui/`):**
  - `Button`: Primary, secondary, outline, ghost, and danger variants with loading spinner states.
  - `Card`: Structured container with rounded corners and subtle border styling.
  - `Badge`: Status badges for success, warning, danger, and neutral states.
  - `Modal`: Accessible dialog wrapper with backdrop blur and escape key handling.
  - `Alert`: Contextual inline messaging for notices, warnings, and errors.
  - `EmptyState`: Clean empty states featuring Lucide icons and call-to-action triggers.
  - `CopyButton`: One-click copy-to-clipboard button with visual checkmark feedback.
  - `Skeleton`: Shimmering placeholder blocks for asynchronous loading states.
- **Responsive Navigation:** Collapsible left sidebar for desktop views, sliding drawer overlay for mobile screens, and a utility top bar with notification center.

---

## 🧪 Testing & Quality Assurance

### Current Status
There are currently **no automated unit, integration, or end-to-end test suites** committed to the repository (no Jest, Vitest, or Playwright configurations).

### Recommended Testing Implementation Roadmap
To achieve enterprise production readiness, the following automated testing setup is recommended:

1. **Unit Testing (`Vitest`):**
   - Test `lib/scheduling/slots.ts`: Verify time slot generation across DST shifts, split intervals, buffers, and maximum booking windows.
   - Test `lib/scheduling/conflicts.ts`: Verify collision detection with external busy slots.
   - Test `lib/integrations/token-encryption.ts`: Validate AES-256-GCM encryption and decryption integrity.
2. **Integration Testing (`Supertest` / Node Test Runner):**
   - Test `POST /api/public/[username]/[eventSlug]/book`: Validate that concurrent requests for the exact same slot result in one success (`201 Created`) and one conflict rejection (`409 Conflict`).
   - Test `POST /api/auth/login` and `POST /api/auth/signup`: Verify session issuance and cookie attributes.
3. **End-to-End Testing (`Playwright`):**
   - Test the complete guest booking journey from public landing page to confirmation screen and `.ics` download.
   - Test host schedule editing and date override creation.

---

## 🏭 Production & Deployment

### Production Build
Compile the application for production:
```bash
npm run build
```
Verify the compiled bundle starts successfully:
```bash
npm run start
```

### Transitioning from SQLite to PostgreSQL
The project uses SQLite locally for zero-dependency development. To deploy to a production PostgreSQL database:

1. **Update `prisma/schema.prisma` datasource:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Set the production connection string in `.env`:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/meetlio?schema=public&sslmode=require"
   ```
3. **Generate Prisma Client and push schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Production Checklist
- [ ] **HTTPS Enforcement:** Host behind an SSL-terminating reverse proxy (e.g. Nginx, Cloudflare, AWS ALB) or deploy to Vercel/AWS.
- [ ] **Secure Cookies:** Ensure `NODE_ENV=production` is set so session cookies strictly mandate the `Secure` flag.
- [ ] **Cron Execution:** Configure a reliable cron runner (Vercel Cron, GitHub Actions, AWS EventBridge) to send authenticated `GET` requests to `https://your-domain.com/api/cron/reminders` with header `x-cron-secret: <CRON_SECRET>` every 15 minutes.
- [ ] **SMTP Configuration:** Supply valid production SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) or integrate a provider like Resend to ensure email deliverability.
- [ ] **OAuth Credentials:** Register production redirect URIs in Google Cloud Console and Microsoft Azure Portal.

---

## 🔄 Git & Synchronization Workflow

- **Repository:** Hosted on GitHub at [https://github.com/Aizaz-01/Meetlio](https://github.com/Aizaz-01/Meetlio).
- **Default Branch:** `main`.
- **Automated Sync Script:** A PowerShell synchronization watcher (`auto-git-sync.ps1`) is included in the project root. It monitors project directory file changes, debounces modifications (15-second window), and automatically commits and pushes to GitHub.
- **Git Ignore Safeguards:** `.gitignore` excludes `node_modules/`, `.next/`, `.env`, `.env*.local`, `*.tsbuildinfo`, and local SQLite databases (`/prisma/dev.db`).

---

## 📈 Future Scope

The following features represent logical architectural enhancements to extend Meetlio:

- [ ] **Automated Meeting Room Generation:** Live API integrations with Zoom and Google Meet to generate dynamic video call links per booking.
- [ ] **Live Stripe Webhooks:** Live payment capture, refunds, and escrow settlement for paid consultation calls.
- [ ] **Multi-Host Visual Assignee UI:** UI selectors for assigning co-hosts on Collective and Round-Robin event types.
- [ ] **Visual Workflow Builder:** Drag-and-drop canvas for designing custom multi-step email and SMS reminder sequences.
- [ ] **SMS Notifications:** SMS reminder delivery via Twilio or MessageBird.
- [ ] **Two-Factor Authentication (2FA):** TOTP-based two-factor authentication for host accounts.
- [ ] **FullCalendar Grid View:** Interactive drag-and-drop week/month calendar grid inside `/app/meetings`.

---

## 🐛 Known Limitations

1. **Local Database Engine:** The current repository configuration utilizes SQLite (`dev.db`). PostgreSQL should be connected before high-concurrency production deployments.
2. **In-Memory Rate Limiting:** The rate limiter (`lib/rate-limit.ts`) uses an in-memory `Map`. In a multi-instance containerized cluster, state is not shared between nodes (an external Redis store would be needed).
3. **Avatar Storage:** User avatar customization currently accepts an image URL string rather than supporting direct image file uploads to an S3/Cloudflare R2 bucket.
4. **Calendar Sync Polling:** Calendar events from Google and Outlook are synchronized upon connection, manual trigger, or initial page load rather than via real-time incoming webhooks from Microsoft Graph or Google Push Notifications.

---

## 🤝 Contributing

Contributions to Meetlio are welcome! Follow these steps:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Changes:**
   ```bash
   git commit -m "feat: implement amazing feature"
   ```
4. **Push to Your Branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** describing your changes, motivation, and verification steps.

---

## 📄 License

This repository does not currently contain an open-source license file (`LICENSE`). All rights are reserved by the author. A formal open-source license (such as MIT or Apache 2.0) or proprietary license terms should be added prior to commercial or public distribution.

---

## 👨‍💻 Author & Repository

- **Author:** Aizaz Nisar
- **GitHub Repository:** [https://github.com/Aizaz-01/Meetlio](https://github.com/Aizaz-01/Meetlio)

---

## 📸 Screenshots

*Screenshots and UI walkthroughs can be added here as the visual interface evolves.*
