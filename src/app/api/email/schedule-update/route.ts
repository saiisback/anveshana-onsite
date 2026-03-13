import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { scheduleUpdateEmail } from "@/lib/email-templates";
import { requireAdmin } from "@/lib/auth-server";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { title, details } = await request.json();

    if (!title || !details) {
      return NextResponse.json(
        { error: "Title and details are required" },
        { status: 400 }
      );
    }

    // Email team leads only (1 per team)
    const teamLeads = await prisma.teamMember.findMany({
      where: { roleInTeam: "lead" },
      include: { user: { select: { email: true } } },
    });

    // Also notify volunteers and judges
    const staff = await prisma.user.findMany({
      where: { role: { in: ["VOLUNTEER", "JUDGE"] } },
      select: { email: true },
    });

    const allEmails = [
      ...teamLeads.map((m) => m.user.email),
      ...staff.map((u) => u.email),
    ];
    const uniqueEmails = [...new Set(allEmails)];

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ message: "No recipients found", sent: 0 });
    }

    const html = scheduleUpdateEmail(title, details);

    const emails = uniqueEmails.map((email) => ({
      to: email,
      subject: `Schedule Update: ${title} — Anveshana 2026`,
      html,
    }));

    await sendEmailsInBatches(emails);

    return NextResponse.json({
      message: "Schedule update emails sent",
      sent: uniqueEmails.length,
    });
  } catch (error) {
    console.error("Schedule update email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
