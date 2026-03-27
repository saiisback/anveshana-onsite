import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const includeMembers = request.nextUrl.searchParams.get("includeMembers") === "true";

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
              prototypeTitle: true,
              category: true,
              ...(includeMembers && {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true },
                    },
                  },
                },
              }),
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
          prototypeTitle: team.prototypeTitle ?? null,
          category: team.category ?? null,
          ...((team as Record<string, unknown>).members && {
            members: ((team as Record<string, unknown>).members as Array<{ user: { id: string; name: string; email: string }; roleInTeam: string }>).map((m) => ({
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              roleInTeam: m.roleInTeam,
            })),
          }),
        }
      : null,
  });
}
