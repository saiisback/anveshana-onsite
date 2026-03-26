# Session 2: Volunteer QR Scanner + Zone Management

> **Scope:** Build the QR check-in scanner page, volunteer zone management APIs, and fix volunteer-specific bugs.
> **Estimated tasks:** 5 main tasks, 18 subtasks
> **Files you OWN (can create/modify):** Everything listed below. No other session touches these.
> **Files you must NOT touch:** `middleware.ts`, `prisma/schema.prisma`, `src/lib/constants.ts`, `sidebar.tsx`, any file under `participant/`, `judge/`, `admin/` (except creating new API routes under `api/admin/volunteer-zones/`)

---

## Project Context

Anveshana is a prototype exhibition. Volunteers are assigned to zones in the venue. Their jobs:
1. **Check in teams** by scanning QR codes at stalls
2. **Handle help requests** from participants (already implemented, but has placeholder session data)
3. **Navigate their assigned zone**

What exists:
- `VolunteerZone` Prisma model (volunteerId, zoneName, building, floor) — **already in schema**
- `html5-qrcode` and `qrcode` packages — **already installed**
- Convex `checkIns` schema with mutations: `create`, `getByTeam`, `list` — **already implemented**
- Volunteer dashboard page at `src/app/(portal)/volunteer/page.tsx` — links to `/volunteer/scan` which **doesn't exist yet**
- Volunteer help requests page — **works but uses placeholder session data**
- Team approval auto-generates QR string: `anveshana-team-${id}` — **this is what volunteers will scan**

---

## Guardrails

1. **Do NOT modify `prisma/schema.prisma`.** The `VolunteerZone` model already exists with all needed fields.
2. **Do NOT modify `src/middleware.ts`** or `src/components/sidebar.tsx`. Other sessions own those.
3. **Do NOT modify any files under `src/app/(portal)/participant/` or `src/app/(portal)/judge/`.**
4. **Use existing Convex mutations for check-ins.** The `convex/checkIns.ts` file already has `create`, `getByTeam`, and `list` mutations. Use them directly.
5. **Use existing auth utilities.** Import `getSession` from `@/lib/auth-server`, `useSession` from `@/lib/auth-client`.
6. **Use existing Prisma client.** Import `prisma` from `@/lib/prisma`.
7. **The QR code format is `anveshana-team-${teamId}`.** When scanning, parse this string to extract the team ID. This is set in `src/app/api/admin/teams/[id]/approve/route.ts` line 38.
8. **For the volunteer session fix,** use `useSession()` from `@/lib/auth-client` to get the actual volunteer ID and name. Do NOT invent a new auth pattern.
9. **Follow existing page patterns.** Look at `src/app/(portal)/volunteer/requests/page.tsx` for the client component pattern with Convex.
10. **No hardcoded strings for roles/statuses.** Define constants at the top of your files.

---

## Tasks

### Task 1: Fix Volunteer Help Requests — Replace Placeholder Session Data

**Modify:** `src/app/(portal)/volunteer/requests/page.tsx`

**The bug:** Lines 26-28 have:
```typescript
// TODO: Replace with actual session data
const volunteerId = "placeholder-volunteer-id";
const volunteerName = "Placeholder Volunteer";
```

This means volunteers can't actually claim requests or see their own requests.

**Subtasks:**
- [ ] 1.1: Import `useSession` from `@/lib/auth-client`
- [ ] 1.2: Call `const { data: session } = useSession()` inside the component
- [ ] 1.3: Replace `volunteerId` with `session?.user?.id`
- [ ] 1.4: Replace `volunteerName` with `session?.user?.name`
- [ ] 1.5: Add a loading state while session is loading (show skeleton or spinner)
- [ ] 1.6: Add a guard: if no session after loading, show error or redirect

**Quality rules:**
- Do NOT add a `useEffect` + `fetch` for session. The `useSession()` hook from better-auth handles this.
- Handle the case where session is `null` gracefully (loading vs error).

---

### Task 2: Fix Volunteer Dashboard — Dead Scan Link

**Modify:** `src/app/(portal)/volunteer/page.tsx`

**The bug:** Line 77 links to `/volunteer/scan` which doesn't exist yet. The card also has some hardcoded data.

**Subtasks:**
- [ ] 2.1: Verify the link href is `/volunteer/scan` (it should be — you're creating that page in Task 3)
- [ ] 2.2: If the volunteer's zone data is not being fetched from the DB, fix it. Check if the page fetches `VolunteerZone` data for the current user. If not, add the query.
- [ ] 2.3: Ensure the "Scan QR" card is visually active (not disabled/greyed out)

**Quality rules:**
- Read the full page first before making changes.
- Only change what's broken. Don't refactor working code.

---

### Task 3: QR Code Scanner Page

**Create:** `src/app/(portal)/volunteer/scan/page.tsx`

This is the main new feature. Volunteers open this page, point their camera at a team's QR code, and it records a check-in.

**Subtasks:**
- [ ] 3.1: Create a client component (`"use client"`) since it needs camera access
- [ ] 3.2: Import and use `Html5QrcodeScanner` from `html5-qrcode`
- [ ] 3.3: On mount, initialize the scanner targeting a div element
- [ ] 3.4: On successful scan, parse the QR string: extract team ID from `anveshana-team-${teamId}` format
- [ ] 3.5: Validate the team ID (fetch team name from Prisma or check via API)
- [ ] 3.6: Show confirmation UI: "Check in Team: [Team Name]?" with Confirm/Cancel buttons
- [ ] 3.7: On confirm, call Convex mutation `api.checkIns.create` with `{ teamId, teamName, checkedInBy: volunteerId, volunteerName }`
- [ ] 3.8: Show success toast with team name
- [ ] 3.9: After check-in, auto-reset scanner for next scan
- [ ] 3.10: Handle errors: invalid QR code, camera permission denied, team not found, already checked in
- [ ] 3.11: Show recent check-ins list below the scanner (use `api.checkIns.list` Convex query)

**Implementation notes:**
- The `html5-qrcode` library needs a DOM element to attach to. Use a `ref` and initialize in `useEffect`.
- Clean up the scanner on unmount: call `scanner.clear()`.
- Camera permission is requested automatically by the library.
- The Convex check-in mutation is at `convex/checkIns.ts` — read it first to understand the exact argument shape.

**Quality rules:**
- Handle ALL error states visually (not just console.error):
  - Camera denied → show message with instructions
  - Invalid QR → show "Not a valid Anveshana QR code"
  - Network error → show retry button
- Clean up the scanner on component unmount to prevent memory leaks.
- Do NOT use `any` types for the scanner instance. The library has TypeScript types.
- Use `useSession()` for volunteer identity, not a placeholder.

---

### Task 4: Team Validation API for QR Scans

**Create:** `src/app/api/admin/teams/validate/route.ts`

The scanner needs to validate that a scanned team ID is real before checking in.

**Subtasks:**
- [ ] 4.1: `GET /api/admin/teams/validate?teamId=xxx`
- [ ] 4.2: Query `prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true, status: true, stallNumber: true } })`
- [ ] 4.3: Return 404 if team not found
- [ ] 4.4: Return team data if found
- [ ] 4.5: Require authenticated session (any role — judges can scan too per PRD)

**Quality rules:**
- Use Zod to validate the query parameter.
- Do NOT use `withAdmin()` — this endpoint is for volunteers and judges too.
- Return minimal data (just what's needed for the confirmation UI).

---

### Task 5: Volunteer Zone Management APIs

**Create:** `src/app/api/admin/volunteer-zones/route.ts`

Admin needs to assign volunteers to zones.

**Subtasks:**
- [ ] 5.1: `GET` — List all volunteer zones with volunteer details
  - Query: `prisma.volunteerZone.findMany({ include: { volunteer: { select: { name: true, email: true } } } })`
- [ ] 5.2: `POST` — Assign volunteer to zone
  - Body: `{ volunteerId, zoneName, building, floor }`
  - Validate: volunteer exists and has role VOLUNTEER
  - Check for duplicate assignment (same volunteer to same zone)
  - Wrap in `withAdmin()`
- [ ] 5.3: Create `src/app/api/admin/volunteer-zones/[id]/route.ts`
  - `PUT` — Update zone assignment
  - `DELETE` — Remove zone assignment
  - Both wrapped in `withAdmin()`

**Quality rules:**
- Use Zod schemas for all request bodies.
- ALL routes use `withAdmin()` from `@/lib/admin-handler`.
- Return proper HTTP status codes.

---

## File Summary

### New Files This Session Creates
```
src/app/(portal)/volunteer/scan/page.tsx              — QR scanner page
src/app/api/admin/teams/validate/route.ts             — Team validation for QR
src/app/api/admin/volunteer-zones/route.ts            — List/create zone assignments
src/app/api/admin/volunteer-zones/[id]/route.ts       — Update/delete zone assignments
```

### Existing Files This Session Modifies
```
src/app/(portal)/volunteer/requests/page.tsx  — Fix placeholder session data (lines 26-28)
src/app/(portal)/volunteer/page.tsx           — Fix dead scan link + zone data fetch
```
