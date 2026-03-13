import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { passwordSetupEmail } from "@/lib/email-templates";
import { generatePasswordSetupToken } from "@/lib/tokens";
import { withAdmin } from "@/lib/admin-handler";
import { APP_URL, EVENT_NAME } from "@/lib/constants";

export const POST = withAdmin(async (
  _request: Request,
  { params }: { params: Promise<Record<string, string>> }
) => {
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

  // Wrap stall number assignment + team update + token generation in a transaction
  const { updatedTeam, emailBatch } = await prisma.$transaction(async (tx) => {
    const lastStall = await tx.team.findFirst({
      where: { stallNumber: { not: null } },
      orderBy: { stallNumber: "desc" },
      select: { stallNumber: true },
    });
    const nextStallNumber = (lastStall?.stallNumber ?? 0) + 1;

    const updated = await tx.team.update({
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

    // Generate password setup tokens inside the transaction
    const batch = [];
    for (const member of updated.members) {
      const setupToken = await generatePasswordSetupToken(member.user.id, tx);
      batch.push({
        to: member.user.email,
        subject: `Team Approved — Set Your Password | ${EVENT_NAME}`,
        html: passwordSetupEmail(member.user.name, `${APP_URL}/set-password?token=${setupToken.token}`),
      });
    }

    return { updatedTeam: updated, emailBatch: batch };
  });

  const emailResult = await sendEmailsInBatches(emailBatch);

  return NextResponse.json({
    message: "Team approved successfully",
    team: updatedTeam,
    emailsSent: emailResult.success,
  });
});
