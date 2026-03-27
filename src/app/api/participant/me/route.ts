import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json({
    userId: session.user.id,
    teamId: membership?.team.id ?? null,
    teamName: membership?.team.name ?? null,
  });
}
