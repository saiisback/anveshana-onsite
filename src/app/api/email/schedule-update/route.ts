import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { scheduleUpdateEmail } from "@/lib/email-templates";
import { withAdmin } from "@/lib/admin-handler";
import { EVENT_NAME } from "@/lib/constants";
import { getTeamLeadEmails } from "@/lib/queries";

const scheduleUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  details: z.string().min(1).max(5000),
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const parsed = scheduleUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, details } = parsed.data;

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
