import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";

type RouteHandler =
  | ((request: Request) => Promise<NextResponse>)
  | ((request: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>);

export function withAdmin(handler: RouteHandler): RouteHandler {
  return async (...args: [Request, { params: Promise<Record<string, string>> }?]) => {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
      if (args.length === 2 && args[1]) {
        return await (handler as (request: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>)(args[0], args[1]);
      }
      return await (handler as (request: Request) => Promise<NextResponse>)(args[0]);
    } catch (err) {
      console.error("Admin route error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
