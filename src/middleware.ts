import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";

const authPaths = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Read the session token cookie directly
  const sessionCookie =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  // If no session cookie and trying to access protected routes, redirect to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify the session by calling the auth API with the cookie forwarded
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: req.nextUrl.origin,
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    }
  );

  if (!session) {
    // Clear stale cookies and redirect
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("better-auth.session_token");
    response.cookies.delete("__Secure-better-auth.session_token");
    return response;
  }

  const role = (session.user as { role?: string })?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/volunteer") && role !== "VOLUNTEER") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/participant") && role !== "PARTICIPANT") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/participant/:path*", "/volunteer/:path*", "/admin/:path*"],
};
