import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBatchEmails } from "@/lib/resend";
import { announcementEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const { title, message, targetRole } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    // For PARTICIPANT role, only email team leads to save quota
    // For other roles, email each user directly
    let recipients: { email: string }[] = [];

    if (targetRole === "ALL" || targetRole === "PARTICIPANT") {
      // Get team lead emails (1 per team instead of all members)
      const teamLeads = await prisma.teamMember.findMany({
        where: { roleInTeam: "lead" },
        include: { user: { select: { email: true } } },
      });
      recipients.push(...teamLeads.map((m) => ({ email: m.user.email })));
    }

    if (targetRole === "ALL" || (targetRole !== "PARTICIPANT")) {
      // Get non-participant users of the target role
      const roleFilter: string[] =
        targetRole === "ALL"
          ? ["VOLUNTEER", "JUDGE", "ADMIN"]
          : [targetRole];

      const users = await prisma.user.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { role: { in: roleFilter as any } },
        select: { email: true },
      });
      recipients.push(...users);
    }

    // Deduplicate emails
    const uniqueEmails = [...new Set(recipients.map((r) => r.email))];

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ message: "No recipients found", sent: 0 });
    }

    const html = announcementEmail(title, message);

    // Batch in groups of 100 (Resend limit)
    const batches = [];
    for (let i = 0; i < uniqueEmails.length; i += 100) {
      const batch = uniqueEmails.slice(i, i + 100).map((email) => ({
        to: email,
        subject: `📢 ${title} — Anveshana 2026`,
        html,
      }));
      batches.push(sendBatchEmails(batch));
    }

    await Promise.all(batches);

    return NextResponse.json({
      message: "Announcement emails sent",
      sent: uniqueEmails.length,
    });
  } catch (error) {
    console.error("Announcement email error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
