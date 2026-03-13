import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { scheduleUpdateEmail } from "@/lib/email-templates";
import { withAdmin } from "@/lib/admin-handler";
import { EVENT_NAME } from "@/lib/constants";
import { getTeamLeadEmails } from "@/lib/queries";

export const POST = withAdmin(async (request: Request) => {
  const { title, details } = await request.json();

  if (!title || !details) {
    return NextResponse.json(
      { error: "Title and details are required" },
      { status: 400 }
    );
  }

  // Email team leads only (1 per team)
  const leadEmails = await getTeamLeadEmails();

  // Also notify volunteers and judges
  const staff = await prisma.user.findMany({
    where: { role: { in: ["VOLUNTEER", "JUDGE"] } },
    select: { email: true },
  });

  const allEmails = [
    ...leadEmails,
    ...staff.map((u) => u.email),
  ];
  const uniqueEmails = [...new Set(allEmails)];

  if (uniqueEmails.length === 0) {
    return NextResponse.json({ message: "No recipients found", sent: 0 });
  }

  const html = scheduleUpdateEmail(title, details);

  const emails = uniqueEmails.map((email) => ({
    to: email,
    subject: `Schedule Update: ${title} — ${EVENT_NAME}`,
    html,
  }));

  await sendEmailsInBatches(emails);

  return NextResponse.json({
    message: "Schedule update emails sent",
    sent: uniqueEmails.length,
  });
});
