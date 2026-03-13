import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { announcementEmail } from "@/lib/email-templates";
import { withAdmin } from "@/lib/admin-handler";
import { EVENT_NAME, VALID_TARGET_ROLES } from "@/lib/constants";
import { getTeamLeadEmails } from "@/lib/queries";
import type { Role } from "@/generated/prisma/enums";

export const POST = withAdmin(async (request: Request) => {
  const { title, message, targetRole } = await request.json();

  if (!title || !message) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }

  if (!VALID_TARGET_ROLES.includes(targetRole)) {
    return NextResponse.json(
      { error: `Invalid targetRole. Must be one of: ${VALID_TARGET_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // For PARTICIPANT role, only email team leads to save quota
  // For other roles, email each user directly
  let recipients: string[] = [];

  if (targetRole === "ALL" || targetRole === "PARTICIPANT") {
    // Get team lead emails (1 per team instead of all members)
    const leadEmails = await getTeamLeadEmails();
    recipients.push(...leadEmails);
  }

  if (targetRole === "ALL" || (targetRole !== "PARTICIPANT")) {
    // Get non-participant users of the target role
    const roleFilter: Role[] =
      targetRole === "ALL"
        ? ["VOLUNTEER", "JUDGE", "ADMIN"]
        : [targetRole as Role];

    const users = await prisma.user.findMany({
      where: { role: { in: roleFilter } },
      select: { email: true },
    });
    recipients.push(...users.map((u) => u.email));
  }

  // Deduplicate emails
  const uniqueEmails = [...new Set(recipients)];

  if (uniqueEmails.length === 0) {
    return NextResponse.json({ message: "No recipients found", sent: 0 });
  }

  const html = announcementEmail(title, message);

  const emails = uniqueEmails.map((email) => ({
    to: email,
    subject: `${title} — ${EVENT_NAME}`,
    html,
  }));

  await sendEmailsInBatches(emails);

  return NextResponse.json({
    message: "Announcement emails sent",
    sent: uniqueEmails.length,
  });
});
