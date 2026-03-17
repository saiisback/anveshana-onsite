import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(async () => {
  const [
    // User counts by role
    totalUsers,
    participantCount,
    volunteerCount,
    judgeCount,
    adminCount,

    // Team counts by status
    totalTeams,
    pendingTeams,
    approvedTeams,
    rejectedTeams,

    // Team members
    totalTeamMembers,
    teamLeadCount,

    // Invitation counts by status
    totalInvitations,
    pendingInvitations,
    usedInvitations,
    expiredInvitations,

    // Judge assignments by status
    totalJudgeAssignments,
    scheduledAssignments,
    inProgressAssignments,
    completedAssignments,

    // Other counts
    totalEvents,
    totalStallLocations,
    totalVolunteerZones,

    // Password setup tokens
    pendingPasswordTokens,
    usedPasswordTokens,

    // Detailed data for breakdowns
    teamsByCategory,
    teamsWithRequirements,
    teamsNeedingPower,
    teamsNeedingInternet,
    teamSizeDistribution,
    recentRegistrations,
    judgeWorkload,
    volunteerZoneDistribution,
  ] = await Promise.all([
    // User counts
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
    prisma.user.count({ where: { role: "VOLUNTEER" } }),
    prisma.user.count({ where: { role: "JUDGE" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),

    // Team counts
    prisma.team.count(),
    prisma.team.count({ where: { status: "PENDING" } }),
    prisma.team.count({ where: { status: "APPROVED" } }),
    prisma.team.count({ where: { status: "REJECTED" } }),

    // Team members
    prisma.teamMember.count(),
    prisma.teamMember.count({ where: { roleInTeam: "lead" } }),

    // Invitation counts
    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: "PENDING" } }),
    prisma.invitation.count({ where: { status: "USED" } }),
    prisma.invitation.count({ where: { status: "EXPIRED" } }),

    // Judge assignments
    prisma.judgeAssignment.count(),
    prisma.judgeAssignment.count({ where: { status: "SCHEDULED" } }),
    prisma.judgeAssignment.count({ where: { status: "IN_PROGRESS" } }),
    prisma.judgeAssignment.count({ where: { status: "COMPLETED" } }),

    // Other
    prisma.event.count(),
    prisma.stallLocation.count(),
    prisma.volunteerZone.count(),

    // Password tokens
    prisma.passwordSetupToken.count({ where: { status: "PENDING" } }),
    prisma.passwordSetupToken.count({ where: { status: "USED" } }),

    // Category breakdown
    prisma.team.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { category: { not: null } },
    }),

    // Teams with special requirements
    prisma.team.count({
      where: {
        OR: [
          { requirements: { not: null } },
          { additionalRequirements: { not: null } },
        ],
      },
    }),

    // Power & internet needs
    prisma.team.count({ where: { powerOutlet: true } }),
    prisma.team.count({ where: { internetNeeded: true } }),

    // Team size distribution (how many members per team)
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    }),

    // Recent registrations (last 7 days)
    prisma.team.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Judge workload (assignments per judge)
    prisma.judgeAssignment.groupBy({
      by: ["judgeId"],
      _count: { id: true },
      _avg: { score: true },
    }),

    // Volunteer zone distribution
    prisma.volunteerZone.groupBy({
      by: ["zoneName", "building", "floor"],
      _count: { id: true },
    }),
  ]);

  // Calculate team size stats
  const teamSizes = teamSizeDistribution.map((t) => t._count.members);
  const avgTeamSize =
    teamSizes.length > 0
      ? teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length
      : 0;
  const maxTeamSize = teamSizes.length > 0 ? Math.max(...teamSizes) : 0;
  const minTeamSize = teamSizes.length > 0 ? Math.min(...teamSizes) : 0;

  // Team size frequency
  const sizeFrequency: Record<number, number> = {};
  for (const size of teamSizes) {
    sizeFrequency[size] = (sizeFrequency[size] || 0) + 1;
  }

  // RSVP rate
  const rsvpRate =
    totalInvitations > 0
      ? ((usedInvitations / totalInvitations) * 100).toFixed(1)
      : "0";

  // Approval rate
  const totalDecided = approvedTeams + rejectedTeams;
  const approvalRate =
    totalDecided > 0
      ? ((approvedTeams / totalDecided) * 100).toFixed(1)
      : "0";

  // Judging progress
  const judgingProgress =
    totalJudgeAssignments > 0
      ? ((completedAssignments / totalJudgeAssignments) * 100).toFixed(1)
      : "0";

  // Stall assignment rate
  const stallAssignmentRate =
    approvedTeams > 0
      ? ((totalStallLocations / approvedTeams) * 100).toFixed(1)
      : "0";

  // Password setup rate
  const totalPasswordTokens = pendingPasswordTokens + usedPasswordTokens;
  const passwordSetupRate =
    totalPasswordTokens > 0
      ? ((usedPasswordTokens / totalPasswordTokens) * 100).toFixed(1)
      : "0";

  return NextResponse.json({
    overview: {
      totalUsers,
      totalTeams,
      totalParticipants: participantCount,
      totalInvitationsSent: totalInvitations,
      rsvpRate: `${rsvpRate}%`,
      approvalRate: `${approvalRate}%`,
    },

    users: {
      total: totalUsers,
      byRole: {
        participants: participantCount,
        volunteers: volunteerCount,
        judges: judgeCount,
        admins: adminCount,
      },
      passwordSetup: {
        completed: usedPasswordTokens,
        pending: pendingPasswordTokens,
        completionRate: `${passwordSetupRate}%`,
      },
    },

    teams: {
      total: totalTeams,
      byStatus: {
        pending: pendingTeams,
        approved: approvedTeams,
        rejected: rejectedTeams,
      },
      approvalRate: `${approvalRate}%`,
      recentRegistrations: {
        last7Days: recentRegistrations,
      },
      members: {
        total: totalTeamMembers,
        leads: teamLeadCount,
        averageTeamSize: Math.round(avgTeamSize * 10) / 10,
        minTeamSize,
        maxTeamSize,
        sizeDistribution: sizeFrequency,
      },
      categories: teamsByCategory.map((c) => ({
        category: c.category ?? "Uncategorized",
        count: c._count.id,
      })),
      logistics: {
        teamsNeedingPowerOutlet: teamsNeedingPower,
        teamsNeedingInternet: teamsNeedingInternet,
        teamsWithSpecialRequirements: teamsWithRequirements,
      },
    },

    invitations: {
      total: totalInvitations,
      byStatus: {
        pending: pendingInvitations,
        used: usedInvitations,
        expired: expiredInvitations,
      },
      rsvpRate: `${rsvpRate}%`,
      conversionFunnel: {
        invited: totalInvitations,
        rsvped: usedInvitations,
        approved: approvedTeams,
        dropOffAtRsvp:
          totalInvitations > 0
            ? `${(((totalInvitations - usedInvitations) / totalInvitations) * 100).toFixed(1)}%`
            : "0%",
        dropOffAtApproval:
          usedInvitations > 0
            ? `${(((usedInvitations - approvedTeams) / usedInvitations) * 100).toFixed(1)}%`
            : "0%",
      },
    },

    judging: {
      totalAssignments: totalJudgeAssignments,
      byStatus: {
        scheduled: scheduledAssignments,
        inProgress: inProgressAssignments,
        completed: completedAssignments,
      },
      progress: `${judgingProgress}%`,
      judgeWorkload: judgeWorkload.map((j) => ({
        judgeId: j.judgeId,
        assignmentCount: j._count.id,
        averageScore: j._avg.score
          ? Math.round(j._avg.score * 100) / 100
          : null,
      })),
    },

    venue: {
      stallLocations: totalStallLocations,
      stallAssignmentRate: `${stallAssignmentRate}%`,
      volunteerZones: totalVolunteerZones,
      zoneDistribution: volunteerZoneDistribution.map((z) => ({
        zone: z.zoneName,
        building: z.building,
        floor: z.floor,
        volunteerCount: z._count.id,
      })),
    },

    events: {
      total: totalEvents,
    },
  });
});
