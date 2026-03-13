import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { teamRejectedEmail } from "@/lib/email-templates";
import { requireAdmin } from "@/lib/auth-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

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

    // Send rejection email to team lead and await result
    let emailSent = false;
    const lead = team.members[0];
    if (lead?.user.email) {
      const result = await sendEmail({
        to: lead.user.email,
        subject: `Team "${team.name}" — Anveshana 3.0 Update`,
        html: teamRejectedEmail(team.name, lead.user.name),
      });
      emailSent = result.success;
    }

    return NextResponse.json({
      message: "Team rejected",
      team: updatedTeam,
      emailSent,
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
