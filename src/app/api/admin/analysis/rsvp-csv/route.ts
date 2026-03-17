import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(async () => {
  const rsvpInvitations = await prisma.invitation.findMany({
    where: { status: "USED" },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const headers = [
    "Invitation Email",
    "RSVP Date",
    "Team Name",
    "Prototype Title",
    "Category",
    "Team Status",
    "Member Name",
    "Member Email",
    "Member Phone",
    "Role in Team",
  ];

  const rows: string[][] = [];

  for (const invitation of rsvpInvitations) {
    const team = invitation.team;
    if (team && team.members.length > 0) {
      for (const member of team.members) {
        rows.push([
          invitation.email,
          invitation.updatedAt.toISOString().split("T")[0],
          team.name,
          team.prototypeTitle ?? "",
          team.category ?? "",
          team.status,
          member.user.name,
          member.user.email,
          member.user.phone ?? "",
          member.roleInTeam,
        ]);
      }
    } else {
      rows.push([
        invitation.email,
        invitation.updatedAt.toISOString().split("T")[0],
        team?.name ?? "",
        team?.prototypeTitle ?? "",
        team?.category ?? "",
        team?.status ?? "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="rsvp-details-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
});
