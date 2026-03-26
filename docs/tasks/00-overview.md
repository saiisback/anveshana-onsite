# Parallel Workstreams — Task Division for 4 Claude Code Sessions

> **Date:** 2026-03-26
> **Project:** Anveshana On-Site Event Management Platform
> **Context:** ~50 teams showcase prototypes at stalls, judges evaluate on schedules, volunteers handle logistics.
> **Stack:** Next.js 16 (App Router), Prisma + Neon, Convex (real-time), better-auth, Resend, Uploadthing, React Three Fiber (unused so far)

---

## How This Works

You are running **4 Claude Code sessions in parallel**. Each session gets its own doc with full context, tasks, subtasks, and guardrails. The division is designed so **no two sessions ever edit the same file**.

### The 4 Sessions

| Session | Doc | Focus | Creates | Modifies |
|---------|-----|-------|---------|----------|
| **1** | [session-1-judge-system.md](./session-1-judge-system.md) | Judge portal, scheduling, admin judge management | `src/app/(portal)/judge/*`, `src/app/api/admin/judges/*`, `convex/judging.ts` | `src/components/sidebar.tsx` (add judge nav) |
| **2** | [session-2-volunteer-qr-zones.md](./session-2-volunteer-qr-zones.md) | QR scanner, volunteer zone mgmt, volunteer fixes | `src/app/(portal)/volunteer/scan/*`, `src/app/api/admin/volunteer-zones/*` | `src/app/(portal)/volunteer/requests/page.tsx`, `src/app/(portal)/volunteer/page.tsx` |
| **3** | [session-3-participant-fixes.md](./session-3-participant-fixes.md) | Participant TODO fixes, schedule view, stall display | `src/app/(portal)/participant/schedule/*` | `src/app/(portal)/participant/help/page.tsx`, `src/app/(portal)/participant/page.tsx` |
| **4** | [session-4-infra-quality.md](./session-4-infra-quality.md) | Shared infra, auth fixes, DRY cleanup, constants, types, error boundaries | `src/lib/constants/*`, `src/types/*`, `src/hooks/*`, `error.tsx` files | `src/middleware.ts`, `src/lib/*`, notification pages, API routes |

---

## File Ownership Rules (CRITICAL)

These rules exist to prevent merge conflicts. **Every file has exactly one owner.**

### Exclusive Ownership

| File / Directory | Owner | Why |
|-----------------|-------|-----|
| `src/app/(portal)/judge/**` | Session 1 | New judge portal |
| `src/app/api/admin/judges/**` | Session 1 | New judge APIs |
| `convex/judging.ts` | Session 1 | New Convex functions for judging |
| `src/components/sidebar.tsx` | Session 1 | Adding judge nav items |
| `src/app/(portal)/volunteer/scan/**` | Session 2 | New QR scanner page |
| `src/app/(portal)/volunteer/requests/page.tsx` | Session 2 | Fix volunteer placeholder |
| `src/app/(portal)/volunteer/page.tsx` | Session 2 | Fix dead scan link |
| `src/app/api/admin/volunteer-zones/**` | Session 2 | New zone APIs |
| `src/app/(portal)/participant/help/page.tsx` | Session 3 | Fix participant placeholder |
| `src/app/(portal)/participant/page.tsx` | Session 3 | Fix stall TBD |
| `src/app/(portal)/participant/schedule/**` | Session 3 | New schedule page |
| `src/middleware.ts` | Session 4 | Fix session check bug |
| `src/lib/constants.ts` | Session 4 | Extract shared constants |
| `src/lib/auth-server.ts` | Session 4 | Refactor auth utilities |
| `src/lib/queries.ts` | Session 4 | Add query helpers |
| `src/types/**` | Session 4 | Shared type definitions |
| `src/hooks/**` | Session 4 | Shared React hooks |
| `src/app/(portal)/participant/notifications/page.tsx` | Session 4 | DRY refactor |
| `src/app/(portal)/volunteer/notifications/page.tsx` | Session 4 | DRY refactor |
| `prisma/schema.prisma` | Session 4 | Schema changes if needed |

### Safe to Import (Any Session)

Any session can **import from** (but not modify):
- `src/lib/prisma.ts`
- `src/lib/auth-server.ts`
- `src/lib/constants.ts`
- `src/lib/resend.ts`
- `src/lib/email-templates.ts`
- `src/components/ui/*` (shadcn components)
- `convex/*` (existing functions)

### Creating New Files

Any session can create new files in directories they own. New files never conflict.

---

## Execution Notes

1. **All 4 sessions start simultaneously.** There are no blocking dependencies.
2. **Sessions 1-3 build new features.** They create new pages/APIs in their own directories.
3. **Session 4 cleans up shared infrastructure.** It modifies existing shared files that no other session touches.
4. **After all 4 complete:** Do a final build check (`pnpm build`) to verify everything compiles together.
5. **If a session needs a new Prisma model:** Only Session 4 edits the schema. Sessions 1-3 should work with existing models (`JudgeAssignment`, `VolunteerZone`, `StallLocation` already exist).

---

## What's Already Working (Do NOT Break)

- Registration flow (public invite-only + admin approval)
- Login + password setup (better-auth + token-based)
- Admin: dashboard, registrations, teams, invitations, analysis, notifications, help requests
- Participant/volunteer notifications (Convex real-time)
- Help request system (Convex: create, claim, resolve)
- Email service (Resend with batch support)
- File upload (Uploadthing for payment screenshots)

---

## Known Code Quality Issues (Addressed Across Sessions)

Each session doc includes quality fixes for its domain. Here's the full inventory:

### Hardcoded Values (80+ instances)
- Role strings ("ADMIN", "PARTICIPANT", etc.) in 10+ files
- Status strings ("PENDING", "APPROVED", etc.) in 10+ files
- Help request statuses and urgency levels duplicated in 3 files each
- Event name "Anveshana 3.0" hardcoded in email templates
- Placeholder Convex URL in 2 files
- **Owner: Session 4** creates the constants, other sessions use string literals in new code (Session 4 will sweep later)

### DRY Violations
- Notification pages (participant vs volunteer) are 99% identical → **Session 4**
- STATUS_COLORS / URGENCY_COLORS maps duplicated 3x → **Session 4**
- Session auth check pattern duplicated in 5+ pages → **Session 4**
- Fetch + error handling pattern repeated in 7+ client components → **Session 4** (creates `useAsyncAction` hook)
- Team status validation duplicated in approve/reject routes → **Session 4**

### Code Smells
- `invitations-client.tsx` is 949 lines → **Not in scope** (works, low risk to refactor now)
- No `error.tsx` files anywhere → **Session 4**
- Missing Zod validation on some email API routes → **Session 4**
- Fire-and-forget email in notifications page (silent failure) → **Session 4**
- `any` types in Three.js components → **Not in scope** (low impact)

### Broken / Incomplete
- Middleware fetches non-existent `/api/auth/get-session` → **Session 4**
- Participant help page uses placeholder team ID → **Session 3**
- Volunteer requests page uses placeholder volunteer ID → **Session 2**
- Participant stall number shows "TBD" → **Session 3**
- Volunteer dashboard links to `/volunteer/scan` which doesn't exist → **Session 2**
- QR code is just a string, not real QR data → **Session 2**
