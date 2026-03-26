import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

const querySchema = z.object({
  teamId: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ teamId: searchParams.get("teamId") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid teamId" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { id: parsed.data.teamId },
    select: { id: true, name: true, status: true, stallNumber: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json(team);
}
