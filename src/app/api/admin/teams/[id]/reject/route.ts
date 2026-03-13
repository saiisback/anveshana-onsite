import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { teamRejectedEmail } from "@/lib/email-templates";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: { roleInTeam: "lead" },
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.status !== "PENDING") {
      return NextResponse.json(
        { error: "Team is not in PENDING status" },
        { status: 400 }
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    // Send rejection email to team lead only
    const lead = team.members[0];
    if (lead?.user.email) {
      sendEmail({
        to: lead.user.email,
        subject: `Team "${team.name}" — Anveshana 3.0 Update`,
        html: teamRejectedEmail(team.name, lead.user.name),
      }).catch((err) => console.error("Rejection email failed:", err));
    }

    return NextResponse.json({
      message: "Team rejected",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
