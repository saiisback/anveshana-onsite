import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendEmailsInBatches } from "@/lib/resend";
import { checkInReminderEmail } from "@/lib/email-templates";
import { withAdmin } from "@/lib/admin-handler";
import { EVENT_NAME, TEAM_ROLE_LEAD } from "@/lib/constants";

const checkInReminderSchema = z.object({
  teamIds: z.array(z.string().min(1)).optional(),
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const parsed = checkInReminderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { teamIds } = parsed.data;

  // Get approved teams that haven't checked in
  const where: Record<string, unknown> = { status: "APPROVED" };
  if (teamIds?.length) {
    where.id = { in: teamIds };
  }

  const teams = await prisma.team.findMany({
    where,
    include: {
      members: {
        where: { roleInTeam: TEAM_ROLE_LEAD },
        include: { user: { select: { email: true } } },
      },
    },
  });

  if (teams.length === 0) {
    return NextResponse.json({ message: "No teams to notify", sent: 0 });
  }

  const emails = teams.flatMap((t) => {
    const lead = t.members[0];
    if (!lead?.user.email) return [];
    return [{
      to: lead.user.email,
      subject: `Check-In Reminder — ${EVENT_NAME}`,
      html: checkInReminderEmail(t.name),
    }];
  });

  await sendEmailsInBatches(emails);

  return NextResponse.json({
    message: "Check-in reminders sent",
    sent: emails.length,
  });
});
