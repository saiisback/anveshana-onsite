# Session 1: Judge System

> **Scope:** Build the complete judge portal, judge scheduling APIs, and admin judge management page.
> **Estimated tasks:** 6 main tasks, 22 subtasks
> **Files you OWN (can create/modify):** Everything listed below. No other session touches these.
> **Files you must NOT touch:** `middleware.ts`, `prisma/schema.prisma`, `src/lib/constants.ts`, any file under `participant/`, `volunteer/` (except importing from shared libs)

---

## Project Context

Anveshana is a prototype exhibition at BMSIT college. ~50 teams at stalls, judges evaluate them on fixed time slots. The database already has:

- `JudgeAssignment` model (judgeId, teamId, timeSlotStart, timeSlotEnd, status, score) — **already in Prisma schema**
- `User` model with `role: JUDGE` — **already exists**
- `StallLocation` model — **already exists**
- Auth system with role-based routing — **already works**

What's missing: No judge-facing pages, no admin UI for managing judges/schedules, no APIs for CRUD on judge assignments.

---

## Guardrails

1. **Do NOT modify `prisma/schema.prisma`.** The `JudgeAssignment` model already has everything you need: `id`, `judgeId`, `teamId`, `timeSlotStart`, `timeSlotEnd`, `status` (SCHEDULED/IN_PROGRESS/COMPLETED), `score`. If you think you need a schema change, work around it or leave a comment.
2. **Do NOT modify `src/middleware.ts`.** Session 4 owns that file. The middleware already routes `/judge/*` paths — it checks for role `JUDGE`. Your pages will work.
3. **Use existing auth utilities.** Import `getSession` from `@/lib/auth-server` for server components. Import `useSession` from `@/lib/auth-client` for client components.
4. **Use existing Prisma client.** Import `prisma` from `@/lib/prisma`.
5. **Use existing email service.** Import from `@/lib/resend` and `@/lib/email-templates` if you need to send emails.
6. **Use existing UI components.** Import from `@/components/ui/*` (shadcn: Button, Card, Badge, Input, Label, Select, Table, Dialog, etc.).
7. **For real-time features,** create a NEW Convex file `convex/judging.ts` rather than editing existing Convex files.
8. **Follow existing patterns.** Look at `src/app/(portal)/admin/registrations/page.tsx` and `registrations-client.tsx` for the server/client component split pattern used throughout the app.
9. **Add the judge navigation items to `src/components/sidebar.tsx`.** You own this file. Add a JUDGE section similar to existing ADMIN/PARTICIPANT/VOLUNTEER sections.
10. **Do NOT use hardcoded role/status strings.** Import from `@/lib/constants` if the constants exist, otherwise define them locally in your files as named constants at the top. Session 4 will consolidate later.

---

## Tasks

### Task 1: Judge Portal — Dashboard Page

**Create:** `src/app/(portal)/judge/page.tsx`

This is the main page judges see after login. Server component that fetches data.

**Subtasks:**
- [ ] 1.1: Create the page as a server component
- [ ] 1.2: Fetch session via `getSession()`, redirect to `/login` if not authenticated
- [ ] 1.3: Fetch today's assignments: `prisma.judgeAssignment.findMany({ where: { judgeId: user.id }, include: { team: true }, orderBy: { timeSlotStart: 'asc' } })`
- [ ] 1.4: Display welcome card with judge name
- [ ] 1.5: Display "Today's Schedule" — list of upcoming team visits with time, team name, stall number, status badge (SCHEDULED/IN_PROGRESS/COMPLETED)
- [ ] 1.6: Display stats: total assigned, completed, remaining
- [ ] 1.7: Each assignment card should link to the evaluation page (Task 3)

**UI Reference:** Follow the stat card pattern from `src/app/(portal)/admin/page.tsx` (grid of cards with icon, label, value).

**Quality rules:**
- No inline styles. Use Tailwind only.
- No hardcoded strings for statuses — define constants at the top of the file.
- Handle empty state (no assignments yet).

---

### Task 2: Judge Portal — Schedule Page

**Create:** `src/app/(portal)/judge/schedule/page.tsx`

Full schedule view (not just today). Server component.

**Subtasks:**
- [ ] 2.1: Create page, fetch all assignments for this judge ordered by `timeSlotStart`
- [ ] 2.2: Group assignments by date
- [ ] 2.3: Display as a timeline/list grouped by date headers
- [ ] 2.4: Each entry shows: time range, team name, prototype title, stall number, status badge
- [ ] 2.5: Color-code by status (SCHEDULED = blue, IN_PROGRESS = yellow, COMPLETED = green)
- [ ] 2.6: Handle empty state

**Quality rules:**
- Extract the status-to-color mapping as a constant object (do NOT repeat it inline).
- If the schedule page and dashboard share UI patterns, extract a shared component into `src/app/(portal)/judge/components/`.

---

### Task 3: Judge Portal — Evaluation Page

**Create:** `src/app/(portal)/judge/evaluate/[assignmentId]/page.tsx`

Where judges score a team. This needs client-side interactivity for the form.

**Subtasks:**
- [ ] 3.1: Create server component wrapper that fetches the assignment + team details
- [ ] 3.2: Create client component `evaluate-client.tsx` in the same directory
- [ ] 3.3: Display team info: name, members, prototype title, description, category
- [ ] 3.4: Score input (numeric, 0-100 or whatever scale makes sense)
- [ ] 3.5: Optional notes/feedback textarea
- [ ] 3.6: Submit button that calls `POST /api/admin/judges/evaluate` (Task 5)
- [ ] 3.7: On submit, update assignment status to COMPLETED
- [ ] 3.8: Show success state after submission, disable re-submission
- [ ] 3.9: "Back to schedule" link

**Quality rules:**
- Use `react-hook-form` + `zod` for form validation (both are already installed).
- Do NOT allow submitting if assignment status is already COMPLETED (check server-side too).
- The score field must have min/max validation.

---

### Task 4: Judge Portal — Notifications Page

**Create:** `src/app/(portal)/judge/notifications/page.tsx`

Reuse the notification pattern from participant/volunteer.

**Subtasks:**
- [ ] 4.1: Create client component using Convex `useQuery(api.notifications.listByUser, { userId })`
- [ ] 4.2: Display notifications list with icon, title, message, relative timestamp
- [ ] 4.3: Mark as read / mark all as read functionality
- [ ] 4.4: Handle empty state

**Quality rules:**
- The participant and volunteer notification pages are 99% identical (this is a known DRY violation that Session 4 will fix). For now, create a clean implementation. Do NOT copy-paste from the other notification pages — write it fresh and keep it clean. Session 4 will extract a shared component later.
- Define `notificationIcon` and `formatTime` helpers at the top of the file.

---

### Task 5: Judge Management APIs

**Create these API routes:**

#### 5a: `src/app/api/admin/judges/route.ts`
- [ ] `GET` — List all judges with their assignment counts
  - Query: `prisma.user.findMany({ where: { role: 'JUDGE' }, include: { judgeAssignments: true } })`
  - Return: judges with `totalAssignments`, `completedAssignments`, `averageScore`
- [ ] `POST` — Create judge assignments (bulk)
  - Body: `{ assignments: [{ judgeId, teamId, timeSlotStart, timeSlotEnd }] }`
  - Validate: no time conflicts (judge not double-booked in overlapping slots)
  - Use Zod for request validation
  - Wrap in `withAdmin()` from `@/lib/admin-handler`

#### 5b: `src/app/api/admin/judges/evaluate/route.ts`
- [ ] `POST` — Submit evaluation score
  - Body: `{ assignmentId, score, notes? }`
  - Validate: assignment exists, belongs to the authenticated judge, status is not COMPLETED
  - Update: set `score`, set `status` to COMPLETED
  - Do NOT wrap in `withAdmin()` — this is for judges, not admins. Validate session and role manually.

#### 5c: `src/app/api/admin/judges/assignments/[id]/route.ts`
- [ ] `PUT` — Update an assignment (admin only)
  - Body: `{ timeSlotStart?, timeSlotEnd?, judgeId?, teamId? }`
  - Validate time conflicts on update
  - Wrap in `withAdmin()`
- [ ] `DELETE` — Remove an assignment (admin only)
  - Wrap in `withAdmin()`

**Quality rules:**
- ALL routes must use Zod schemas for request validation. Define schemas at the top of each file.
- ALL admin routes must use `withAdmin()` wrapper from `@/lib/admin-handler`.
- Return proper HTTP status codes: 200 success, 400 validation error, 401 unauthorized, 404 not found, 409 conflict (time overlap).
- Time conflict detection: Before creating/updating an assignment, check that the judge doesn't have another assignment where `timeSlotStart < newEnd AND timeSlotEnd > newStart`.

---

### Task 6: Admin — Judge Management Page

**Create:** `src/app/(portal)/admin/judges/page.tsx` + `judges-client.tsx`

Admin page to view judges, create assignments, manage schedules.

**Subtasks:**
- [ ] 6.1: Server component fetches all judges, all approved teams, all assignments
- [ ] 6.2: Client component with tabs: "Judges", "Assignments", "Create Schedule"
- [ ] 6.3: **Judges tab:** Table of judges with name, email, total assignments, completed, avg score
- [ ] 6.4: **Assignments tab:** Table of all assignments with judge name, team name, time slot, status. Filterable by judge, by date, by status.
- [ ] 6.5: **Create Schedule tab:** Form to create assignments — select judge, select team, pick time slot start/end. Bulk creation support (assign one judge to multiple teams in sequence).
- [ ] 6.6: Delete assignment button (with confirmation dialog)
- [ ] 6.7: Edit assignment (change time/judge) via dialog

**Quality rules:**
- Split the client component into sub-components if it exceeds 300 lines. Put them in `src/app/(portal)/admin/judges/components/`.
- Use the same table styling pattern as `src/app/(portal)/admin/teams/page.tsx`.
- Time picker: Use native `<input type="datetime-local" />` — don't over-engineer this.

---

### Task 7: Sidebar Navigation — Add Judge Items

**Modify:** `src/components/sidebar.tsx`

**Subtasks:**
- [ ] 7.1: Add a JUDGE section to the `navItemsByRole` config (or equivalent pattern in the file)
- [ ] 7.2: Judge nav items: Dashboard (`/judge`), Schedule (`/judge/schedule`), Notifications (`/judge/notifications`)
- [ ] 7.3: Add "Judges" link to the ADMIN nav section pointing to `/admin/judges`
- [ ] 7.4: Follow the exact same pattern as existing nav items (icon + label + href)

**Quality rules:**
- Read the sidebar file first. Follow its exact patterns. Do not refactor it.
- Use lucide-react icons consistent with the rest (e.g., `Gavel` or `Scale` for judge).

---

## File Summary

### New Files This Session Creates
```
src/app/(portal)/judge/page.tsx                          — Judge dashboard
src/app/(portal)/judge/schedule/page.tsx                 — Full schedule view
src/app/(portal)/judge/evaluate/[assignmentId]/page.tsx  — Evaluation wrapper
src/app/(portal)/judge/evaluate/[assignmentId]/evaluate-client.tsx — Eval form
src/app/(portal)/judge/notifications/page.tsx            — Notifications
src/app/(portal)/judge/components/                       — Shared judge UI (if needed)
src/app/api/admin/judges/route.ts                        — List judges + create assignments
src/app/api/admin/judges/evaluate/route.ts               — Submit score
src/app/api/admin/judges/assignments/[id]/route.ts       — Update/delete assignment
src/app/(portal)/admin/judges/page.tsx                   — Admin judge mgmt wrapper
src/app/(portal)/admin/judges/judges-client.tsx           — Admin judge mgmt client
src/app/(portal)/admin/judges/components/                 — Sub-components (if needed)
convex/judging.ts                                         — Real-time judging functions (if needed)
```

### Existing Files This Session Modifies
```
src/components/sidebar.tsx — Add judge nav items + admin judges link
```
