import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, type Session } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

export type { Role };

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export function getUserRole(session: Session): Role {
  const role = (session.user as { role?: string })?.role;
  if (role === "ADMIN" || role === "VOLUNTEER" || role === "PARTICIPANT" || role === "JUDGE") {
    return role;
  }
  return "PARTICIPANT";
}

export async function requireAdmin(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (getUserRole(session) !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
