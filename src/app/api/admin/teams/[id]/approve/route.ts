import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { passwordSetupEmail } from "@/lib/email-templates";
import { generatePasswordSetupToken } from "@/lib/tokens";
import { requireAdmin } from "@/lib/auth-server";
import { APP_URL } from "@/lib/constants";

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
          include: {
            user: { select: { id: true, name: true, email: true } },
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

    // Generate QR code string using team ID
    const qrCode = `anveshana-team-${id}`;

    // Wrap stall number assignment + team update in a transaction to prevent race conditions
    const updatedTeam = await prisma.$transaction(async (tx) => {
      const lastStall = await tx.team.findFirst({
        where: { stallNumber: { not: null } },
        orderBy: { stallNumber: "desc" },
        select: { stallNumber: true },
      });
      const nextStallNumber = (lastStall?.stallNumber ?? 0) + 1;

      return tx.team.update({
        where: { id },
        data: {
          status: "APPROVED",
          stallNumber: nextStallNumber,
          qrCode,
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    });

    // Generate password setup tokens for ALL members and send emails
    const emailBatch = await Promise.all(
      updatedTeam.members.map(async (member) => {
        const setupToken = await generatePasswordSetupToken(member.user.id);
        return {
          to: member.user.email,
          subject: `Team Approved — Set Your Password | Anveshana 3.0`,
          html: passwordSetupEmail(member.user.name, `${APP_URL}/set-password?token=${setupToken.token}`),
        };
      })
    );

    const emailResult = await sendEmailsInBatches(emailBatch);

    return NextResponse.json({
      message: "Team approved successfully",
      team: updatedTeam,
      emailsSent: emailResult.success,
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
