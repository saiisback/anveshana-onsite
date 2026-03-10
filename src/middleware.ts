import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "@/lib/auth";

export async function middleware(req: NextRequest) {
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const pathname = req.nextUrl.pathname;
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
