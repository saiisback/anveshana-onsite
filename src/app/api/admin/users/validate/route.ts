import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembers: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              stallNumber: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const team = user.teamMembers?.[0]?.team;

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: team
      ? {
          id: team.id,
          name: team.name,
          stallNumber: team.stallNumber,
          status: team.status,
        }
      : null,
  });
}
