import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIES, ROLE_DASHBOARDS } from "@/lib/constants";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Read the session token cookie directly
  const sessionCookie =
    req.cookies.get(AUTH_COOKIES.SESSION)?.value ??
    req.cookies.get(AUTH_COOKIES.SESSION_SECURE)?.value;

  // If no session cookie and trying to access protected routes, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify the session by calling the auth API with the cookie forwarded
  const res = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
  });

  const session = res.ok ? await res.json() : null;

  if (!session) {
    // Clear stale cookies and redirect
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(AUTH_COOKIES.SESSION);
    response.cookies.delete(AUTH_COOKIES.SESSION_SECURE);
    return response;
  }

  const role = (session.user as { role?: string })?.role ?? "PARTICIPANT";

  const roleRouteMap: Record<string, string> = {
    "/admin": "ADMIN",
    "/volunteer": "VOLUNTEER",
    "/participant": "PARTICIPANT",
    "/judge": "JUDGE",
  };

  for (const [prefix, requiredRole] of Object.entries(roleRouteMap)) {
    if (pathname.startsWith(prefix) && role !== requiredRole) {
      return NextResponse.redirect(
        new URL(ROLE_DASHBOARDS[role] || "/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/participant/:path*", "/volunteer/:path*", "/admin/:path*", "/judge/:path*"],
};
