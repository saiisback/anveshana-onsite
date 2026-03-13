import prisma from "@/lib/prisma";
import { TEAM_ROLE_LEAD } from "@/lib/constants";

/**
 * Returns lead emails for teams matching the given filter.
 */
export async function getTeamLeadEmails(teamWhere?: Record<string, unknown>): Promise<string[]> {
  const teamLeads = await prisma.teamMember.findMany({
    where: {
      roleInTeam: TEAM_ROLE_LEAD,
      ...(teamWhere ? { team: teamWhere } : {}),
    },
    include: { user: { select: { email: true } } },
  });
  return teamLeads.map((m) => m.user.email);
}
