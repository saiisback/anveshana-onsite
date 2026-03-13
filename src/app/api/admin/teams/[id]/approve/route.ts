import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBatchTemplateEmails, TEMPLATE_IDS } from "@/lib/resend";
import { generatePasswordSetupToken } from "@/lib/tokens";

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

    // Find the next available stall number
    const lastStall = await prisma.team.findFirst({
      where: { stallNumber: { not: null } },
      orderBy: { stallNumber: "desc" },
      select: { stallNumber: true },
    });
    const nextStallNumber = (lastStall?.stallNumber ?? 0) + 1;

    // Generate QR code string using team ID
    const qrCode = `anveshana-team-${id}`;

    const updatedTeam = await prisma.team.update({
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

    // Generate password setup tokens for ALL members and send emails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailBatch = await Promise.all(
      updatedTeam.members.map(async (member) => {
        const setupToken = await generatePasswordSetupToken(member.user.id);
        return {
          to: member.user.email,
          subject: `Team Approved — Set Your Password | Anveshana 2026`,
          templateId: TEMPLATE_IDS.passwordSetup,
          data: {
            NAME: member.user.name,
            SETUP_URL: `${appUrl}/set-password?token=${setupToken.token}`,
          },
        };
      })
    );

    // Send batch emails (fire-and-forget)
    sendBatchTemplateEmails(emailBatch).catch((err) =>
      console.error("Password setup email failed:", err)
    );

    return NextResponse.json({
      message: "Team approved successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
