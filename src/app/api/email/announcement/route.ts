import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { announcementEmail } from "@/lib/email-templates";
import { withAdmin } from "@/lib/admin-handler";
import { EVENT_NAME } from "@/lib/constants";
import { getTeamLeadEmails } from "@/lib/queries";
import type { Role } from "@/generated/prisma/enums";

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  targetRole: z.enum(["ALL", "PARTICIPANT", "VOLUNTEER", "JUDGE", "ADMIN"]),
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const parsed = announcementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, message, targetRole } = parsed.data;

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
