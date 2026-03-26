# Session 4: Shared Infrastructure, Auth Fixes, and Code Quality

> **Scope:** Fix the broken middleware, extract shared constants/types/hooks, eliminate DRY violations, add error boundaries, and harden API validation.
> **Estimated tasks:** 8 main tasks, 35 subtasks
> **Files you OWN (can create/modify):** Everything listed below. This session touches the most files but creates minimal new features — it's a quality and infra pass.
> **Files you must NOT touch:** `sidebar.tsx` (Session 1), volunteer pages except notifications (Session 2), participant pages except notifications (Session 3), any file under `judge/` (Session 1)

---

## Project Context

Anveshana is an event management platform. The core features work, but the codebase has accumulated quality debt:

- **Middleware is broken:** Fetches `/api/auth/get-session` which may not exist in better-auth's catch-all handler
- **80+ hardcoded strings:** Role names, status values, urgency levels repeated everywhere
- **DRY violations:** Notification pages are 99% copy-pasted, status/urgency color maps duplicated 3x, auth check pattern repeated 5x, fetch+error patterns repeated 7x
- **No error boundaries:** Zero `error.tsx` files in the entire app
- **Missing types:** No shared type definitions; interfaces redefined in multiple files
- **Missing validation:** Some email API routes skip Zod validation
- **Silent failures:** Email sends fail silently in notification page

This session fixes all of that without touching any feature code that other sessions are building.

---

## Guardrails

1. **Do NOT modify `src/components/sidebar.tsx`.** Session 1 owns it.
2. **Do NOT modify any file under `src/app/(portal)/volunteer/` EXCEPT `volunteer/notifications/page.tsx`.** Session 2 owns the rest.
3. **Do NOT modify any file under `src/app/(portal)/participant/` EXCEPT `participant/notifications/page.tsx`.** Session 3 owns the rest.
4. **Do NOT create any files under `src/app/(portal)/judge/`.** Session 1 owns that.
5. **When modifying existing files, make minimal targeted changes.** Don't refactor working logic. Only extract constants, fix bugs, and reduce duplication.
6. **Test that existing imports still work after moving things.** If you extract a type from a page file to a shared file, the page file should import from the shared location.
7. **Do NOT rename database columns or change Prisma schema structure.** Only add new models/fields if absolutely necessary (likely not needed).
8. **Every change must be backward-compatible.** Other sessions import from `@/lib/*` — don't break those imports.

---

## Tasks

### Task 1: Extract Shared Constants

**Create:** `src/lib/constants/index.ts` (expand the existing `src/lib/constants.ts` or create a directory)

The existing `src/lib/constants.ts` has: `APP_URL`, `EVENT_NAME`, `TOKEN_EXPIRY`, `MIN_PASSWORD_LENGTH`, `TEAM_ROLES`, `EMAIL_BATCH_SIZE`.

**Subtasks:**
- [ ] 1.1: Read the existing `src/lib/constants.ts` first
- [ ] 1.2: Add user role constants:
  ```typescript
  export const ROLES = {
    ADMIN: "ADMIN",
    PARTICIPANT: "PARTICIPANT",
    VOLUNTEER: "VOLUNTEER",
    JUDGE: "JUDGE",
  } as const;
  ```
- [ ] 1.3: Add team status constants:
  ```typescript
  export const TEAM_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  } as const;
  ```
- [ ] 1.4: Add judge assignment status constants:
  ```typescript
  export const JUDGE_STATUS = {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
  } as const;
  ```
- [ ] 1.5: Add invitation status constants:
  ```typescript
  export const INVITATION_STATUS = {
    PENDING: "PENDING",
    USED: "USED",
    EXPIRED: "EXPIRED",
  } as const;
  ```
- [ ] 1.6: Add help request constants:
  ```typescript
  export const HELP_STATUS = {
    OPEN: "OPEN",
    CLAIMED: "CLAIMED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
  } as const;

  export const URGENCY = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  } as const;

  export const HELP_CATEGORIES = ["Technical", "Logistics", "Judge", "Other"] as const;
  ```
- [ ] 1.7: Add shared color maps (currently duplicated in 3 files):
  ```typescript
  export const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    CLAIMED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    RESOLVED: "bg-green-100 text-green-800",
  };

  export const URGENCY_COLORS: Record<string, string> = {
    Low: "bg-slate-100 text-slate-800",
    Medium: "bg-orange-100 text-orange-800",
    High: "bg-red-100 text-red-800",
  };
  ```
- [ ] 1.8: Add role-to-dashboard route mapping:
  ```typescript
  export const ROLE_DASHBOARDS: Record<string, string> = {
    ADMIN: "/admin",
    PARTICIPANT: "/participant",
    VOLUNTEER: "/volunteer",
    JUDGE: "/judge",
  };
  ```
- [ ] 1.9: Add event tagline constant:
  ```typescript
  export const EVENT_TAGLINE = "National Prototype Competition";
  ```
- [ ] 1.10: Add cookie name constants:
  ```typescript
  export const AUTH_COOKIES = {
    SESSION: "better-auth.session_token",
    SESSION_SECURE: "__Secure-better-auth.session_token",
  } as const;
  ```

**Quality rules:**
- Use `as const` for all constant objects so TypeScript infers literal types.
- Export everything. Other sessions and future code will import from here.
- Do NOT delete the existing constants — only add to them.
- If you restructure from a single file to a directory, make sure the import path `@/lib/constants` still works (use an `index.ts` barrel).

---

### Task 2: Extract Shared Types

**Create:** `src/types/models.ts`

Currently, interfaces like `TeamMember`, `PendingTeam`, `HelpRequest` are defined inline in page files.

**Subtasks:**
- [ ] 2.1: Read these files to find inline type definitions:
  - `src/app/(portal)/admin/registrations/registrations-client.tsx` (lines 35-56: `TeamMember`, `PendingTeam`)
  - `src/app/(portal)/admin/help-requests/page.tsx` (line 37: help request type)
  - `src/app/(portal)/participant/help/page.tsx` (line 33: urgency type)
- [ ] 2.2: Create `src/types/models.ts` with shared interfaces:
  ```typescript
  export interface TeamMemberBasic {
    name: string;
    email: string;
    roleInTeam: string;
  }
  ```
- [ ] 2.3: Export type aliases for common enum-like unions:
  ```typescript
  export type UserRole = "ADMIN" | "PARTICIPANT" | "VOLUNTEER" | "JUDGE";
  export type TeamStatus = "PENDING" | "APPROVED" | "REJECTED";
  export type HelpRequestStatus = "OPEN" | "CLAIMED" | "IN_PROGRESS" | "RESOLVED";
  export type UrgencyLevel = "Low" | "Medium" | "High";
  export type HelpCategory = "Technical" | "Logistics" | "Judge" | "Other";
  ```
- [ ] 2.4: Do NOT update existing files to import from the new types file. Just create the definitions. Other sessions and future work will use them. Changing existing imports risks breaking things that are working.

**Quality rules:**
- Types should match what Prisma generates where possible. Check `src/generated/prisma/client` for the canonical types.
- Do NOT re-export Prisma generated types. Just create clean interfaces for the shapes used in UI/API layers.

---

### Task 3: Fix Middleware Session Check

**Modify:** `src/middleware.ts`

**The bug:** Line 17 fetches `/api/auth/get-session` to validate the session cookie. This endpoint may not exist as a standalone route — better-auth exposes it through its catch-all handler at `/api/auth/[...all]`.

**Subtasks:**
- [ ] 3.1: Read the full middleware file
- [ ] 3.2: Read `src/app/api/auth/[...all]/route.ts` to understand how better-auth is configured
- [ ] 3.3: Read `src/lib/auth.ts` to understand the auth config
- [ ] 3.4: Fix the session validation. Options (pick the one that works with better-auth):
  - **Option A:** The `/api/auth/get-session` endpoint might actually work through the catch-all `[...all]` handler. Test this by checking if better-auth's `toNextJsHandler` handles it. If it does, the middleware is fine.
  - **Option B:** Use better-auth's server-side session validation directly. Import the auth instance and call `auth.api.getSession({ headers })` instead of making an HTTP fetch.
  - **Option C:** If using the fetch approach, ensure the URL is correct and the cookies are forwarded properly.
- [ ] 3.5: Replace hardcoded cookie names with constants (after Task 1 is done, or define them locally):
  - `"better-auth.session_token"` → use constant
  - `"__Secure-better-auth.session_token"` → use constant
- [ ] 3.6: Replace hardcoded role strings and dashboard routes with constants
- [ ] 3.7: Ensure the middleware handles the JUDGE role correctly (route `/judge/*` requires role JUDGE)

**Quality rules:**
- The middleware runs on EVERY request. Keep it fast.
- Do NOT add database queries to the middleware.
- Do NOT import Prisma in the middleware (it runs on the edge in some configs).
- Test both cases: valid session and invalid/expired session.

---

### Task 4: Create Shared React Hooks

**Create:** `src/hooks/use-async-action.ts`

The codebase repeats this exact pattern in 7+ client components:
```typescript
const [loading, setLoading] = useState(false);
try {
  setLoading(true);
  const res = await fetch(...);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Failed");
  }
  toast.success("...");
} catch (error) {
  toast.error(error instanceof Error ? error.message : "...");
} finally {
  setLoading(false);
}
```

**Subtasks:**
- [ ] 4.1: Create the hook:
  ```typescript
  export function useAsyncAction() {
    const [loading, setLoading] = useState(false);

    async function execute(
      action: () => Promise<Response>,
      options: {
        successMessage?: string;
        errorMessage?: string;
        onSuccess?: (data: any) => void;
        onError?: (error: Error) => void;
      } = {}
    ): Promise<boolean> {
      setLoading(true);
      try {
        const res = await action();
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? options.errorMessage ?? "Action failed");
        }
        if (options.successMessage) toast.success(options.successMessage);
        if (options.onSuccess) {
          const data = await res.json().catch(() => null);
          options.onSuccess(data);
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : (options.errorMessage ?? "Something went wrong");
        toast.error(message);
        if (options.onError) options.onError(error instanceof Error ? error : new Error(message));
        return false;
      } finally {
        setLoading(false);
      }
    }

    return { loading, execute };
  }
  ```
- [ ] 4.2: Do NOT refactor existing components to use this hook. Just create it. New code (Sessions 1-3) and future work will use it.

**Quality rules:**
- The hook must be generic — no business logic.
- Return `boolean` from `execute` so callers know if it succeeded.
- Do NOT swallow errors silently. Always show a toast.

---

### Task 5: DRY Fix — Shared Notification Component

**Create:** `src/components/notifications-page.tsx`
**Modify:** `src/app/(portal)/participant/notifications/page.tsx`
**Modify:** `src/app/(portal)/volunteer/notifications/page.tsx`

These two pages are 99% identical. Extract a shared component.

**Subtasks:**
- [ ] 5.1: Read both notification pages fully
- [ ] 5.2: Identify the differences (should be just the subtitle text and page title)
- [ ] 5.3: Create `src/components/notifications-page.tsx` — a client component that accepts props:
  ```typescript
  interface NotificationsPageProps {
    title: string;
    subtitle: string;
    userId: string;
  }
  ```
- [ ] 5.4: Move all shared logic into the component: `notificationIcon` map, `formatTime` helper, Convex queries, mark-as-read mutations, JSX layout
- [ ] 5.5: Update `participant/notifications/page.tsx` to import and render the shared component with participant-specific props
- [ ] 5.6: Update `volunteer/notifications/page.tsx` to import and render the shared component with volunteer-specific props
- [ ] 5.7: Both pages should be thin wrappers (< 20 lines each)

**Quality rules:**
- The shared component must be a client component (`"use client"`) since it uses Convex hooks.
- The two page files still need to get the `userId` from session. They can use `useSession()` and pass it down.
- Do NOT change the visual appearance. Only extract the code.

---

### Task 6: DRY Fix — Shared Status/Urgency Color Maps

This is handled by Task 1 (constants extraction). After Task 1, the duplicated maps in these files should be replaced:

**Modify:**
- `src/app/(portal)/admin/help-requests/page.tsx` — Remove local `STATUS_COLORS` and `URGENCY_COLORS`, import from constants
- `src/app/(portal)/admin/notifications/page.tsx` — Fix silent email failure (show warning toast if email send fails)

**Subtasks:**
- [ ] 6.1: In `admin/help-requests/page.tsx`, replace local `STATUS_COLORS` (lines 25-28) with import from `@/lib/constants`
- [ ] 6.2: In `admin/help-requests/page.tsx`, replace local `URGENCY_COLORS` (lines 31-34) with import from `@/lib/constants`
- [ ] 6.3: In `admin/notifications/page.tsx`, fix the fire-and-forget email issue (lines 58-69):
  - Currently: `fetch("/api/email/announcement", ...).catch(console.error)` — user sees "sent" even if email fails
  - Fix: Show `toast.warning("Announcement saved but email delivery failed")` on catch
- [ ] 6.4: Do NOT touch the help-requests or notifications page in `participant/` or `volunteer/` — those are owned by Sessions 2 and 3.

**Quality rules:**
- Only replace the constant definitions. Do NOT refactor surrounding code.
- Verify the import path works before saving.

---

### Task 7: Add Error Boundaries

**Create error.tsx files** for all major route groups. Next.js uses these to catch runtime errors gracefully.

**Subtasks:**
- [ ] 7.1: Create `src/app/(portal)/error.tsx` — catches errors in all portal pages
  ```typescript
  "use client";
  export default function PortalError({ error, reset }: { error: Error; reset: () => void }) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="rounded bg-primary px-4 py-2 text-primary-foreground">
          Try again
        </button>
      </div>
    );
  }
  ```
- [ ] 7.2: Create `src/app/(auth)/error.tsx` — catches errors in auth pages
- [ ] 7.3: Create `src/app/(public)/error.tsx` — catches errors in public pages
- [ ] 7.4: All error pages must be client components (`"use client"`)
- [ ] 7.5: All should show the error message + a "Try again" button that calls `reset()`
- [ ] 7.6: Style consistently with the rest of the app (Tailwind, dark-compatible)

**Quality rules:**
- Keep error boundaries simple. No complex logic.
- Do NOT log errors to console in error boundaries (Next.js already logs them).
- Do NOT show stack traces to users.

---

### Task 8: Harden API Validation

**Modify:** Email API routes that skip Zod validation.

**Subtasks:**
- [ ] 8.1: Read `src/app/api/email/announcement/route.ts` — add Zod schema for request body (`title`, `message`, `targetRole`)
- [ ] 8.2: Read `src/app/api/email/check-in-reminder/route.ts` — add Zod validation for `teamIds` (must be array of strings or undefined)
- [ ] 8.3: Read `src/app/api/email/schedule-update/route.ts` — add Zod validation for request body
- [ ] 8.4: For each route, define the schema at the top of the file and validate early:
  ```typescript
  const schema = z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
    targetRole: z.enum(["ALL", "PARTICIPANT", "VOLUNTEER", "JUDGE", "ADMIN"]),
  });
  ```
- [ ] 8.5: Return 400 with Zod error details on validation failure

**Quality rules:**
- Do NOT change the behavior of these routes. Only add input validation.
- Keep schemas simple and close to the handler (top of same file).
- Do NOT import schemas from a shared file for these — they're route-specific.

---

## File Summary

### New Files This Session Creates
```
src/types/models.ts                           — Shared TypeScript types
src/hooks/use-async-action.ts                 — Shared fetch+error hook
src/components/notifications-page.tsx         — Shared notification component
src/app/(portal)/error.tsx                    — Portal error boundary
src/app/(auth)/error.tsx                      — Auth error boundary
src/app/(public)/error.tsx                    — Public error boundary
```

### Existing Files This Session Modifies
```
src/lib/constants.ts                          — Add role/status/urgency/color constants
src/middleware.ts                             — Fix session check, use constants
src/app/(portal)/participant/notifications/page.tsx — Replace with thin wrapper
src/app/(portal)/volunteer/notifications/page.tsx   — Replace with thin wrapper
src/app/(portal)/admin/help-requests/page.tsx       — Import shared color maps
src/app/(portal)/admin/notifications/page.tsx       — Fix silent email failure
src/app/api/email/announcement/route.ts             — Add Zod validation
src/app/api/email/check-in-reminder/route.ts        — Add Zod validation
src/app/api/email/schedule-update/route.ts          — Add Zod validation
```
