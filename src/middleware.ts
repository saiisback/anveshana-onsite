import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes - only ADMIN role
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Volunteer routes - only VOLUNTEER role
    if (pathname.startsWith("/volunteer") && token?.role !== "VOLUNTEER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Participant routes - only PARTICIPANT role
    if (pathname.startsWith("/participant") && token?.role !== "PARTICIPANT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/participant/:path*", "/volunteer/:path*", "/admin/:path*"],
};
