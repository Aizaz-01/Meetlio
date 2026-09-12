# Meetlio vs. Calendly — Feature Parity & UI/UX Gap Analysis Report

**Document Date:** August 27, 2026  
**Project:** Meetlio Scheduling Platform (`M:\meetlio` / `C:\Users\H&S TECH\.gemini\antigravity\scratch\meetlio`)  
**Scope:** Screen-by-Screen Audit, Scheduling Engine Audit, UI/UX Systems Analysis, Gap Matrix, and Actionable Implementation Roadmap.

---

## 1. Executive Summary

This report presents a screen-by-screen and subsystem-by-subsystem gap analysis comparing **Meetlio** to commercial scheduling SaaS platforms like **Calendly**. 

Meetlio has implemented Phases 1 through 11, providing solid core functionality:
- Type-safe PostgreSQL database schema (Prisma ORM)
- Session authentication with Bcryptjs password hashing
- Timezone-aware UTC slot generation engine
- Atomic double-booking race condition protection
- SaaS billing tiers (FREE, PRO, BUSINESS) with server-side quota enforcement
- Public host landing pages (`/[username]`) and multi-step booking flows
- Outbound webhooks, asynchronous audit logs, Nodemailer email notifications, and automated 24h/1h reminders
- Event kind architecture (`ONE_ON_ONE`, `GROUP`, `COLLECTIVE`, `ROUND_ROBIN`), Event Duplication (`POST /api/events/[id]/duplicate`), and Embed Code Generator (Inline, Popup Widget, Popup Text)

However, achieving true feature parity with Calendly requires closing specific UI/UX, workflow automation, and multi-schedule availability gaps identified in this audit.

---

## 2. Screen-by-Screen Gap Report (23 User Flows)

### 1. Public Landing Page (`/`)
- **Current Implementation:** Responsive SaaS landing page with hero header, feature cards, pricing grid, live scheduling demo preview, and call-to-action buttons.
- **Missing Functionality:** Interactive live booking widget preview on landing page; interactive ROI calculator.
- **Missing UI Components:** Floating customer testimonial badge; animated scheduling flow preview.
- **Missing Interactions:** Smooth scroll section navigation anchors.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **N/A** | API: **READY** | Priority: **Low**

### 2. Signup Flow (`/signup`)
- **Current Implementation:** Split-screen authentication card collecting Name, Email, Username, Password with Bcryptjs hashing and session cookie set.
- **Missing Functionality:** Social OAuth signup (Google/Microsoft OAuth buttons); password strength meter.
- **Missing UI Components:** SSO login link; terms & privacy agreement checkboxes.
- **Missing Interactions:** Real-time username availability checker.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 3. Login Flow (`/login`)
- **Current Implementation:** Authenticated login form with session cookie issue and error alerting.
- **Missing Functionality:** "Remember me" extended session token; Social OAuth login.
- **Missing UI Components:** Single Sign-On (SSO) login alternative button.
- **Missing Interactions:** Inline field error validation on submit.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 4. Onboarding Flow (`/onboarding` or `/dashboard`)
- **Current Implementation:** "Get started" checklist drawer on Dashboard home (`app/dashboard/page.tsx`).
- **Missing Functionality:** Dedicated step-by-step wizard route (`/onboarding`) for new accounts (choose custom URL $\rightarrow$ connect calendar $\rightarrow$ set working hours).
- **Missing UI Components:** Stepper progress bar component (`Step 1 of 3`).
- **Missing Interactions:** Wizard step completion persistence.
- **Broken/Placeholder:** "Get started" sidebar cards are static guidance items.
- **Status:** Backend: **PARTIAL** | Database: **READY** | API: **PARTIAL** | Priority: **High**

### 5. Dashboard Home (`/dashboard`)
- **Current Implementation:** Compact left icon sidebar (`C` mark), top bar with `+ Add contact` CTA, email workflow banner, hero welcome, metric cards, recent activity, and right-hand "Get started" panel.
- **Missing Functionality:** One-click booking link copy from top bar; quick date picker for today's agenda.
- **Missing UI Components:** Quick meeting launcher dropdown; calendar filter tabs (Today, Upcoming, Pending).
- **Missing Interactions:** Dismissing top Gmail banner permanently per user in DB.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 6. Event Types (`/dashboard/event-types`)
- **Current Implementation:** Grid of event cards with tabs (`All`, `One-on-One`, `Group`, `Collective`, `Round Robin`), event duplication trigger, question manager modal, and Share & Embed modal (Inline, Popup Widget, Popup Text).
- **Missing Functionality:** Event type reordering; Event type color picker; Collective / Round-Robin co-host assignee selector UI.
- **Missing UI Components:** Color pill indicator on event cards; host avatar stack for collective/round-robin events.
- **Missing Interactions:** Drag-and-drop event reordering.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **High**

### 7. Event Creation Flow (`/dashboard/event-types` Modal)
- **Current Implementation:** Modal form collecting Title, Slug, Description, Duration presets, Event Kind (`ONE_ON_ONE`, `GROUP`, `COLLECTIVE`, `ROUND_ROBIN`), Max Attendees, and Location.
- **Missing Functionality:** Custom booking questions setup inside the creation wizard (currently handled via separate modal).
- **Missing UI Components:** Multi-step tabbed creation wizard (1. What event is this? 2. When can people book? 3. Booking questions).
- **Missing Interactions:** Auto-checking slug availability on change.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 8. Event Editing Flow (`/dashboard/event-types` Modal)
- **Current Implementation:** Modal editing Title, Slug, Description, Duration, Location, and Active status.
- **Missing Functionality:** Schedule selector dropdown (assigning event type to a specific `AvailabilitySchedule`).
- **Missing UI Components:** Schedule picker select field; custom color indicator.
- **Missing Interactions:** Live preview of event card changes.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY (`scheduleId`)** | API: **PARTIAL** | Priority: **High**

### 9. Availability Schedules (`/dashboard/availability`)
- **Current Implementation:** Weekly hours grid (`AvailabilityGrid`) supporting active day toggles and multiple intervals per day (e.g. 09:00-12:00 & 13:00-17:00), timezone selector, and date overrides (`DateOverridesManager`).
- **Missing Functionality:** UI management for multiple named schedules (`AvailabilitySchedule` model: Create Schedule, Rename Schedule, Delete Schedule, Set Default Schedule).
- **Missing UI Components:** Schedule switcher dropdown/tab bar (`Working Hours`, `Custom Schedule`); "Copy hours to all days" button.
- **Missing Interactions:** Quick copy day schedule to selected days.
- **Broken/Placeholder:** The DB supports `AvailabilitySchedule`, but the frontend currently edits a single weekly schedule.
- **Status:** Backend: **READY** | Database: **READY** | API: **PARTIAL** | Priority: **Critical**

### 10. Scheduled Events (`/dashboard/bookings`)
- **Current Implementation:** Tabbed list (`Upcoming`, `Past`, `Cancelled`), ILIKE search, status badge, guest details, host cancel modal, host reschedule modal, and pagination.
- **Missing Functionality:** Export bookings to CSV/Excel; filter by event type dropdown; filter by date range picker.
- **Missing UI Components:** Event type filter select; Date range picker component; Bulk action checkboxes.
- **Missing Interactions:** Multi-booking selection and bulk cancellation.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 11. Calendar (`/dashboard/calendar`)
- **Current Implementation:** Dedicated Calendar page with Month / Week / Day view toggles, Date navigation (`Previous`, `Today`, `Next`), meeting cards from PostgreSQL, and detail modal.
- **Missing Functionality:** Drag-and-drop meeting rescheduling on week/day grid view.
- **Missing UI Components:** Full interactive calendar grid with hourly time lines (similar to FullCalendar).
- **Missing Interactions:** Click on empty calendar slot to create instant meeting.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 12. Workflows (`/dashboard/workflows`)
- **Current Implementation:** Workflow rules page with rule creation modal (`name`, `trigger` e.g. `booking.created`, `actionType` e.g. `SEND_EMAIL`, `SEND_REMINDER`) and delete controls.
- **Missing Functionality:** Custom email template editor for workflow actions; time offset trigger configuration (e.g., "Send email 2 hours before event").
- **Missing UI Components:** Visual workflow node diagram / builder UI.
- **Missing Interactions:** Live test trigger dispatch.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 13. Integrations (`/dashboard/integrations`)
- **Current Implementation:** Dedicated App Integrations directory featuring Google Calendar, Outlook Calendar, Zoom, Microsoft Teams, Google Meet with connection status tags (`CONNECTED`, `NOT_CONNECTED`, `DEVELOPMENT_MODE`) and connect/disconnect controls.
- **Missing Functionality:** Live production OAuth redirect flows (`/api/auth/google/callback`, `/api/auth/outlook/callback`) requiring production client credentials.
- **Missing UI Components:** Real-time sync logs tab.
- **Missing Interactions:** Re-sync calendar button.
- **Broken/Placeholder:** Uses development fallback simulation when OAuth credentials are absent.
- **Status:** Backend: **READY (Architecture)** | Database: **READY** | API: **READY** | Priority: **Low**

### 14. Webhooks (`/dashboard/webhooks`)
- **Current Implementation:** Webhook endpoint management with secret masking, event selector checkboxes (`booking.created`, `booking.cancelled`, `booking.rescheduled`), active toggle, and payload delivery.
- **Missing Functionality:** Webhook delivery logs inspection modal (response status code, payload, headers, retry button).
- **Missing UI Components:** Delivery log history drawer.
- **Missing Interactions:** "Test Webhook Endpoint" trigger.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 15. Billing (`/dashboard/billing`)
- **Current Implementation:** Subscription management dashboard displaying current plan (`FREE`, `PRO`, `BUSINESS`), status badge, progress bars, warning banners (50%, 80%, 90%, 100%), pricing comparison grid, checkout session creation, cancel, and resume triggers.
- **Missing Functionality:** Invoice history list & download receipt links.
- **Missing UI Components:** Past invoices table.
- **Missing Interactions:** Annual vs Monthly toggle updating live price math.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 16. Settings (`/dashboard/settings`)
- **Current Implementation:** User profile form (Name, Email, Bio, Timezone, Avatar URL), password change card, and default scheduling notice/window rules.
- **Missing Functionality:** Avatar image file upload widget (currently accepts image URL).
- **Missing UI Components:** File upload dropzone for avatar.
- **Missing Interactions:** Live avatar crop preview.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 17. Public Booking Page (`/booking/[username]/[eventSlug]`)
- **Current Implementation:** 3-Column Calendly-style layout (Column 1: Host avatar & Event info; Column 2: Date Picker & Time slots; Column 3: Guest details & Custom questions form).
- **Missing Functionality:** Stepper navigation bar on mobile screen sizes.
- **Missing UI Components:** Mobile step indicator (`Step 1: Select Time`, `Step 2: Enter Details`).
- **Missing Interactions:** Smooth transition when selecting slot on mobile.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 18. Date Selection (Public Booking)
- **Current Implementation:** Date input picker querying `/api/public/[username]/[eventSlug]/availability` for selected date.
- **Missing Functionality:** Full monthly calendar grid view with visual dots indicating available days.
- **Missing UI Components:** Custom Month Calendar Grid component with clickable available dates.
- **Missing Interactions:** Previous/Next month navigation.
- **Broken/Placeholder:** Currently uses native date input selector.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **High**

### 19. Time Slot Selection (Public Booking)
- **Current Implementation:** Slot grid displaying available time slots in guest timezone with selected state styling.
- **Missing Functionality:** 12-hour / 24-hour time format toggle.
- **Missing UI Components:** Time format switch pill (`12h` / `24h`).
- **Missing Interactions:** Instant slot reservation timer (5-minute lock).
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 20. Guest Details & Questions (Public Booking)
- **Current Implementation:** Form collecting Guest Name, Email, Phone, and dynamic `EventBookingQuestion` fields (`SHORT_TEXT`, `LONG_TEXT`, `PHONE`, `SINGLE_SELECT`, `MULTI_SELECT`).
- **Missing Functionality:** Additional guest invitees (adding colleague CC emails to booking).
- **Missing UI Components:** "+ Add Guests" input tag list.
- **Missing Interactions:** Dynamic email validation feedback.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Medium**

### 21. Booking Confirmation Page (`/booking/[username]/[eventSlug]/confirmation`)
- **Current Implementation:** "You're Scheduled!" confirmation screen displaying Event name, Host, Guest email, Date, Time, Timezone, Location, submitted answers, Add to Google/Outlook Calendar links, `.ics` download, Reschedule, and Cancel buttons.
- **Missing Functionality:** Direct button to create another meeting.
- **Missing UI Components:** "Schedule another event" CTA button.
- **Missing Interactions:** 1-click add to Apple Calendar.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 22. Reschedule Flow (`/reschedule/[token]`)
- **Current Implementation:** Secure token page enabling guest to pick a new start time, checking time slot availability and atomic database update.
- **Missing Functionality:** Optional reason input field during guest rescheduling.
- **Missing UI Components:** Reschedule reason textarea.
- **Missing Interactions:** Live conflict check before submit.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

### 23. Cancellation Flow (`/cancel/[token]`)
- **Current Implementation:** Secure token page allowing guest to confirm cancellation with reason, updating booking status to `CANCELLED` and sending email notifications.
- **Missing Functionality:** Quick reschedule link on cancellation screen ("Changed your mind? Reschedule instead").
- **Missing UI Components:** Switch to reschedule CTA button.
- **Missing Interactions:** Instant confirmation toast.
- **Broken/Placeholder:** None.
- **Status:** Backend: **READY** | Database: **READY** | API: **READY** | Priority: **Low**

---

## 3. Scheduling Subsystems Audit

### Event Types Subsystem
- **One-on-One Events:** Fully implemented and supported.
- **Group Events:** DB supports `kind: "GROUP"` & `maxAttendees`. UI input exists. Capacity conflict logic implemented.
- **Collective Events:** DB supports `kind: "COLLECTIVE"` & `EventTypeHost` model. Multi-host availability intersection logic defined. UI needs multi-host selector.
- **Round Robin Events:** DB supports `kind: "ROUND_ROBIN"` & `EventTypeHost.priority`. Host rotation logic defined. UI needs priority assignment.
- **Event Duplication:** Fully implemented via `POST /api/events/[id]/duplicate`.
- **Share & Embed System:** Fully implemented with Inline Embed, Popup Widget, and Popup Text generator.

### Availability Subsystem
- **Multiple Named Schedules:** Database schema (`AvailabilitySchedule`) is complete. Frontend UI needs schedule selector dropdown to allow users to switch between multiple named schedules.
- **Weekly Working Hours & Multi-Intervals:** Fully implemented with multi-interval support per day.
- **Date Overrides:** Fully implemented via `AvailabilityOverride` model and manager UI.
- **Timezone Engine:** Fully implemented with UTC instant calculations date-fns/timezone helpers.

### Booking & Confirmation Subsystem
- **Atomic Conflict Checking:** Fully implemented with race-condition protection.
- **Custom Questions:** Fully implemented with `EventBookingQuestion` & `BookingAnswer`.
- **Confirmation & ICS:** Fully implemented with Google/Outlook links and `.ics` download.

### Integrations Subsystem
- **Provider Architecture:** Fully implemented via `CalendarConnection` & `ExternalCalendarEvent`.
- **Conflict Engine:** Slot generator subtracts external busy events from available slots.
- **Directory UI:** Fully implemented with truthful `DEVELOPMENT_MODE` / `CONNECTED` tags.

---

## 4. Feature Parity Status Summary

### Fully Implemented Features (32/40)
1. User Authentication (Signup, Login, Logout, Session Cookies)
2. Event Types CRUD with URL slug generation
3. Duration Presets (15, 30, 45, 60, 90 mins) & Custom duration
4. Meeting Locations (Google Meet, Zoom, Teams, Phone, In-person, Custom)
5. Custom Booking Questions (`SHORT_TEXT`, `LONG_TEXT`, `PHONE`, `SINGLE_SELECT`, `MULTI_SELECT`)
6. Guest Answer Persistence (`BookingAnswer`)
7. Event Duplication (`POST /api/events/[id]/duplicate`)
8. Share & Embed System (Inline Embed, Popup Widget, Popup Text)
9. Event Kind Architecture (`ONE_ON_ONE`, `GROUP`, `COLLECTIVE`, `ROUND_ROBIN`)
10. Group Event Capacity (`maxAttendees`)
11. Weekly Working Hours with Multi-Intervals per day
12. Date Overrides (Available / Unavailable dates)
13. Timezone Conversion Engine (UTC Instant calculation)
14. Atomic Race-Condition Double Booking Protection
15. 3-Column Calendly Public Booking Page
16. Booking Confirmation Screen with Google/Outlook Calendar links
17. RFC 5545 `.ics` Calendar Invites Export
18. Secure Token Guest Cancellation (`/cancel/[token]`)
19. Secure Token Guest Rescheduling (`/reschedule/[token]`)
20. Automated Email Notifications (Nodemailer SMTP integration)
21. Automated 24h and 1h Reminder Cron Pipeline
22. Outbound Webhooks with HMAC-SHA256 Signatures
23. Operational & Security Audit Logging
24. Subscription Billing Tiers (`FREE`, `PRO`, `BUSINESS`)
25. Server-Side Usage Quotas (`canCreateBooking`, `canCreateEventType`, `canCreateWebhook`)
26. Interactive Subscription Management Dashboard
27. Public Pricing Landing Page (`/pricing`)
28. Search, Status Filtering & Pagination on Bookings
29. Scheduled Calendar View (Month / Week / Day)
30. Workflows & Automations Rule Builder
31. App Integrations Directory (`/dashboard/integrations`)
32. Rate Limiting (429 Protection) & Global Error Boundaries

### Partially Implemented / Gap Features (6/40)
1. **Multiple Schedules UI:** DB model `AvailabilitySchedule` exists, but Availability frontend edits a single schedule instead of providing a schedule selection bar.
2. **Custom Month Calendar Grid on Public Booking:** Public booking page uses native date selector instead of an embedded month calendar grid with highlighted dates.
3. **Collective / Round Robin Co-Host Assignee Selector UI:** Database model `EventTypeHost` exists, but event type edit modal lacks multi-select host picker.
4. **Onboarding Wizard Route (`/onboarding`):** "Get started" drawer exists on dashboard, but dedicated onboarding route is absent.
5. **Additional Guest Invitees:** Booking form collects guest name and email, but lacks "+ Add Guest Email" CC chips input.
6. **Avatar File Upload Dropzone:** Settings page accepts avatar image URL instead of drag-and-drop file upload.

### Deferred / External Credential Dependent (2/40)
1. **Live Production OAuth Redirects:** Live Google/Outlook OAuth token exchange endpoints (requires user's production Google/Microsoft OAuth credentials).
2. **Third-Party Webhook Delivery Logs Modal:** Detailed HTTP request/response log viewer drawer for webhooks.

---

## 5. Exact Files Needing Modification & Recommended Implementation Order

### Step 1: Availability Schedule Selector UI
- **File:** `app/dashboard/availability/page.tsx` & `components/dashboard/availability-grid.tsx`
- **Action:** Add schedule selector dropdown allowing hosts to create, select, rename, and set default availability schedules (`AvailabilitySchedule`).

### Step 2: Public Booking Custom Month Calendar Component
- **File:** `app/booking/[username]/[eventSlug]/booking-client.tsx`
- **Action:** Replace native date input with a custom Calendly-style interactive month calendar grid displaying date availability indicators.

### Step 3: Collective / Round-Robin Co-Host Selector in Event Builder
- **File:** `app/dashboard/event-types/page.tsx`
- **Action:** Add co-host priority & assignee selector for Collective and Round-Robin event kinds.

### Step 4: Dedicated Onboarding Wizard Route
- **File:** `app/onboarding/page.tsx` (NEW)
- **Action:** Create 3-step onboarding wizard for new user registrations (Custom URL $\rightarrow$ Working Hours $\rightarrow$ Calendar Sync).

---

## 6. Audit Conclusion & Next Steps

This gap analysis is saved in `CALENDLY_PARITY_GAP_REPORT.md`. All existing backend engines, database models, security guards, and Phase 1-11 features are intact and passing build verification.
