# Meetlio — Organization & Multi-Tenant Architecture Compatibility Analysis

**Document Date:** August 27, 2026  
**Project:** Meetlio Scheduling Platform (`M:\meetlio` / `C:\Users\H&S TECH\.gemini\antigravity\scratch\meetlio`)  
**Scope:** Architectural Audit of Current User-Centric Schema & Blueprint for Multi-Tenant Organization Migration.

---

## 1. Executive Summary

Meetlio currently operates on a single-tier **User-Centric Architecture** where data models (`EventType`, `AvailabilitySchedule`, `Booking`, `WebhookEndpoint`, `Workflow`, `Plan`, `Subscription`) belong directly to a individual `User.id`.

Transitioning to an Enterprise Multi-Tenant Organization architecture requires introducing `Organization` and `OrganizationMember` models without breaking existing single-user accounts.

---

## 2. Table-by-Table Organization Schema Audit

| Current Model | Target Field | Relation Change | Migration Impact |
| :--- | :--- | :--- | :--- |
| **`User`** | `currentOrgId` (nullable) | Belongs to multiple `OrganizationMember` records | Low |
| **`EventType`** | `organizationId` (nullable) | Optional relation to `Organization` for team events | Medium |
| **`AvailabilitySchedule`** | `organizationId` (nullable) | Allows shared team working hour templates | Low |
| **`Booking`** | `organizationId` (nullable) | Enables org-wide analytics & billing reporting | Medium |
| **`WebhookEndpoint`** | `organizationId` (nullable) | Org-level webhook dispatches | Low |
| **`Workflow`** | `organizationId` (nullable) | Org-wide automation rule execution | Medium |

---

## 3. Proposed Enterprise Schema Extensions

```prisma
model Organization {
  id          String               @id @default(cuid())
  name        String
  slug        String               @unique
  logoUrl     String?
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  members     OrganizationMember[]
  eventTypes  EventType[]
  bookings    Booking[]
  workflows   Workflow[]
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String       // "OWNER", "ADMIN", "MEMBER"
  createdAt      DateTime     @default(now())

  @@unique([organizationId, userId])
}
```

---

## 4. Ownership & Authorization Guard Plan

1. **Backward Compatibility**: All existing queries checking `where: { userId: user.id }` remain functional for personal workspaces.
2. **Organization Context Guard**: Middleware evaluates `X-Organization-Id` header or `user.currentOrgId`.
3. **Role-Based Access Control (RBAC)**:
   - `OWNER`: Full administrative access + billing control.
   - `ADMIN`: Manage event types, schedules, workflows, and view team bookings.
   - `MEMBER`: Manage personal availability & assigned round-robin/collective events.

---

## 5. Billing & Subscription Implications

- Single user subscriptions (`FREE`, `PRO`, `BUSINESS`) map to personal workspaces.
- Enterprise plans (`ENTERPRISE`) introduce seat-based pricing calculated via `count(OrganizationMember)`.
