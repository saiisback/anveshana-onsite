import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBatchEmails } from "@/lib/resend";
import { checkInReminderEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { teamIds } = (await request.json()) as { teamIds?: string[] };

    // Get approved teams that haven't checked in
    const where: Record<string, unknown> = { status: "APPROVED" };
    if (teamIds?.length) {
      where.id = { in: teamIds };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        members: {
          where: { roleInTeam: "lead" },
          include: { user: { select: { email: true } } },
        },
      },
    });

    if (teams.length === 0) {
      return NextResponse.json({ message: "No teams to notify", sent: 0 });
    }

    const emails = teams
      .filter((t) => t.members[0]?.user.email)
      .map((t) => ({
        to: t.members[0].user.email,
        subject: `Check-In Reminder — Anveshana 2026`,
        html: checkInReminderEmail(t.name),
      }));

    // Batch in groups of 100
    const batches = [];
    for (let i = 0; i < emails.length; i += 100) {
      batches.push(sendBatchEmails(emails.slice(i, i + 100)));
    }
    await Promise.all(batches);

    return NextResponse.json({
      message: "Check-in reminders sent",
      sent: emails.length,
    });
  } catch (error) {
    console.error("Check-in reminder email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
