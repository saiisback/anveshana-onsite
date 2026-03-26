# Session 3: Participant Fixes + Schedule View

> **Scope:** Fix all participant-facing bugs, build the judge schedule view for participants, and improve participant dashboard.
> **Estimated tasks:** 4 main tasks, 15 subtasks
> **Files you OWN (can create/modify):** Everything listed below. No other session touches these.
> **Files you must NOT touch:** `middleware.ts`, `prisma/schema.prisma`, `src/lib/constants.ts`, `sidebar.tsx`, any file under `volunteer/`, `judge/`, `admin/` (except importing from shared libs)

---

## Project Context

Anveshana is a prototype exhibition. Participants are team members who:
1. Register their team and prototype
2. Get assigned a stall after admin approval
3. See when judges are visiting their stall
4. Raise help requests if they need assistance

What exists:
- Participant dashboard at `src/app/(portal)/participant/page.tsx` — **has bugs** (stall shows "TBD", help card disabled)
- Participant help page at `src/app/(portal)/participant/help/page.tsx` — **works but uses placeholder session data**
- Participant notifications — **works fine**
- `JudgeAssignment` model in Prisma with `teamId`, `timeSlotStart`, `timeSlotEnd`, `status` — **exists, can query**
- `TeamMember` model links users to teams — **exists**
- Auth provides user session with `id`, `name`, `email`, `role`

Key data flow for participants:
1. User logs in → session has `user.id`
2. `TeamMember` table maps `userId` → `teamId`
3. `Team` table has `stallNumber`, `status`, etc.
4. `JudgeAssignment` table has entries where `teamId` matches

---

## Guardrails

1. **Do NOT modify `prisma/schema.prisma`.** All models you need already exist.
2. **Do NOT modify `src/middleware.ts`** or `src/components/sidebar.tsx`. Other sessions own those.
3. **Do NOT modify any files under `src/app/(portal)/volunteer/`, `src/app/(portal)/judge/`, or `src/app/(portal)/admin/`.**
4. **Use existing auth utilities.** Import `getSession` from `@/lib/auth-server` for server components, `useSession` from `@/lib/auth-client` for client components.
5. **Use existing Prisma client.** Import `prisma` from `@/lib/prisma`.
6. **To find a user's team:** Query `prisma.teamMember.findFirst({ where: { userId }, include: { team: true } })`. This gives you the team and all its data including `stallNumber`.
7. **Follow existing patterns.** The participant dashboard is a server component. Keep it that way. The help page is a client component (Convex). Keep it that way.
8. **No hardcoded strings.** Define constants at the top of your files for statuses, role strings, etc.

---

## Tasks

### Task 1: Fix Participant Dashboard — Stall Number "TBD"

**Modify:** `src/app/(portal)/participant/page.tsx`

**The bug:** Line 75 shows a hardcoded "TBD" for stall number instead of fetching the actual value from the database.

**Subtasks:**
- [ ] 1.1: Read the full file first to understand the existing data fetching
- [ ] 1.2: Check if the page already fetches team data. If yes, the stall number should be available on the team object as `team.stallNumber`
- [ ] 1.3: Replace the hardcoded "TBD" with the actual `stallNumber` value
- [ ] 1.4: If `stallNumber` is null (team approved but stall not yet assigned), show "Not assigned yet" instead of "TBD"
- [ ] 1.5: If the team status is PENDING, show "Pending approval" in the stall card
- [ ] 1.6: Verify the team status badge logic is correct (should show PENDING/APPROVED based on `team.status`)

**Quality rules:**
- Do NOT change the page from server to client component. It should stay server-rendered.
- Handle all states: no team found, team pending, team approved without stall, team approved with stall.
- Do NOT hardcode any status strings inline. Use a const or the enum value.

---

### Task 2: Fix Participant Help Page — Replace Placeholder Session Data

**Modify:** `src/app/(portal)/participant/help/page.tsx`

**The bug:** Lines 36-38 have:
```typescript
// TODO: Replace with actual session data
const teamId = "placeholder-team-id";
const teamName = "Placeholder Team";
```

This means help requests are created with fake team data.

**Subtasks:**
- [ ] 2.1: Read the full file to understand the component structure
- [ ] 2.2: Import `useSession` from `@/lib/auth-client`
- [ ] 2.3: Use `const { data: session } = useSession()` to get the logged-in user
- [ ] 2.4: The user's ID comes from `session.user.id`. But you need the **team ID**, not the user ID. You need to fetch the team membership.
- [ ] 2.5: Create a small API route or use an existing one to resolve `userId → teamId + teamName`. Options:
  - **Option A (preferred):** Create `src/app/api/participant/team/route.ts` that returns the current user's team data
  - **Option B:** Fetch from Convex if team data is synced there
- [ ] 2.6: Use the resolved `teamId` and `teamName` in the help request creation
- [ ] 2.7: Add loading state while team data is being fetched
- [ ] 2.8: Handle edge case: user is not a member of any team (show error message)

**Quality rules:**
- The help page is a `"use client"` component using Convex. Keep it that way.
- Do NOT make it a server component just to get team data — use a small API call or pass team data as props from a server wrapper.
- Handle loading and error states visually (skeleton/spinner for loading, error message for failures).

---

### Task 3: Participant Team API (for Help Page)

**Create:** `src/app/api/participant/team/route.ts`

Small API that returns the current user's team info. Needed by the help page (Task 2) and schedule page (Task 4).

**Subtasks:**
- [ ] 3.1: `GET` handler that reads session from `getSession()`
- [ ] 3.2: Query: `prisma.teamMember.findFirst({ where: { userId: session.user.id }, include: { team: { select: { id: true, name: true, stallNumber: true, status: true } } } })`
- [ ] 3.3: Return 401 if no session
- [ ] 3.4: Return 404 if user has no team
- [ ] 3.5: Return the team data

**Quality rules:**
- Do NOT use `withAdmin()` — this is for participants.
- Validate the session exists. No other input to validate (it reads from the session).
- Return minimal data (only what participant pages need).

---

### Task 4: Participant Schedule Page — Judge Visit Schedule

**Create:** `src/app/(portal)/participant/schedule/page.tsx`

Teams need to see when judges are visiting their stall. Server component.

**Subtasks:**
- [ ] 4.1: Create page as server component
- [ ] 4.2: Get session, redirect to `/login` if not authenticated
- [ ] 4.3: Find the user's team: `prisma.teamMember.findFirst({ where: { userId }, include: { team: true } })`
- [ ] 4.4: Fetch judge assignments for the team: `prisma.judgeAssignment.findMany({ where: { teamId }, include: { judge: { select: { name: true } } }, orderBy: { timeSlotStart: 'asc' } })`
- [ ] 4.5: Display as a timeline: each entry shows time range, judge name, status
- [ ] 4.6: Status badges: SCHEDULED (upcoming, blue), IN_PROGRESS (happening now, yellow), COMPLETED (done, green with score if available)
- [ ] 4.7: Handle empty state: "No judge visits scheduled yet"
- [ ] 4.8: Handle team not found: "You're not part of a team"

**Quality rules:**
- Server component — fetch data directly with Prisma.
- Do NOT expose judge IDs or internal data to participants. Only show: judge name, time, status, score (if completed).
- Define status color mapping as a constant at the top.
- Format time slots in a human-readable way (e.g., "10:00 AM - 10:20 AM").

---

## File Summary

### New Files This Session Creates
```
src/app/(portal)/participant/schedule/page.tsx  — Judge visit schedule
src/app/api/participant/team/route.ts           — Get current user's team
```

### Existing Files This Session Modifies
```
src/app/(portal)/participant/page.tsx           — Fix stall "TBD" display
src/app/(portal)/participant/help/page.tsx      — Fix placeholder team ID/name
```
