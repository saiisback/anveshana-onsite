import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const checkIn = await convex.query(api.checkIns.getByVisitor, { visitorId: userId });
    return NextResponse.json({ checkedIn: !!checkIn });
  } catch {
    return NextResponse.json({ checkedIn: false });
  }
}
