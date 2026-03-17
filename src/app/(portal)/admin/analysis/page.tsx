import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Gavel,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Wifi,
  BarChart3,
  TrendingUp,
  Shield,
  MapPin,
} from "lucide-react";

export default async function AnalysisPage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const [
    totalUsers,
    participantCount,
    volunteerCount,
    judgeCount,
    adminCount,

    totalTeams,
    pendingTeams,
    approvedTeams,
    rejectedTeams,

    totalTeamMembers,
    teamLeadCount,

    totalInvitations,
    pendingInvitations,
    usedInvitations,
    expiredInvitations,

    totalJudgeAssignments,
    scheduledAssignments,
    inProgressAssignments,
    completedAssignments,

    totalStallLocations,
    totalVolunteerZones,

    pendingPasswordTokens,
    usedPasswordTokens,

    teamsByCategory,
    teamsNeedingPower,
    teamsNeedingInternet,
    teamsWithRequirements,

    teamSizeData,
    recentRegistrations,
    judgeWorkload,
    volunteerZoneDistribution,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
    prisma.user.count({ where: { role: "VOLUNTEER" } }),
    prisma.user.count({ where: { role: "JUDGE" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),

    prisma.team.count(),
    prisma.team.count({ where: { status: "PENDING" } }),
    prisma.team.count({ where: { status: "APPROVED" } }),
    prisma.team.count({ where: { status: "REJECTED" } }),

    prisma.teamMember.count(),
    prisma.teamMember.count({ where: { roleInTeam: "lead" } }),

    prisma.invitation.count(),
    prisma.invitation.count({ where: { status: "PENDING" } }),
    prisma.invitation.count({ where: { status: "USED" } }),
    prisma.invitation.count({ where: { status: "EXPIRED" } }),

    prisma.judgeAssignment.count(),
    prisma.judgeAssignment.count({ where: { status: "SCHEDULED" } }),
    prisma.judgeAssignment.count({ where: { status: "IN_PROGRESS" } }),
    prisma.judgeAssignment.count({ where: { status: "COMPLETED" } }),

    prisma.stallLocation.count(),
    prisma.volunteerZone.count(),

    prisma.passwordSetupToken.count({ where: { status: "PENDING" } }),
    prisma.passwordSetupToken.count({ where: { status: "USED" } }),

    prisma.team.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { category: { not: null } },
    }),

    prisma.team.count({ where: { powerOutlet: true } }),
    prisma.team.count({ where: { internetNeeded: true } }),
    prisma.team.count({
      where: {
        OR: [
          { requirements: { not: null } },
          { additionalRequirements: { not: null } },
        ],
      },
    }),

    prisma.team.findMany({
      select: { _count: { select: { members: true } } },
    }),

    prisma.team.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),

    prisma.judgeAssignment.groupBy({
      by: ["judgeId"],
      _count: { id: true },
      _avg: { score: true },
    }),

    prisma.volunteerZone.groupBy({
      by: ["zoneName", "building", "floor"],
      _count: { id: true },
    }),
  ]);

  // Calculated stats
  const teamSizes = teamSizeData.map((t) => t._count.members);
  const avgTeamSize =
    teamSizes.length > 0
      ? Math.round(
          (teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length) * 10
        ) / 10
      : 0;
  const maxTeamSize = teamSizes.length > 0 ? Math.max(...teamSizes) : 0;
  const minTeamSize = teamSizes.length > 0 ? Math.min(...teamSizes) : 0;

  const rsvpRate =
    totalInvitations > 0
      ? Math.round((usedInvitations / totalInvitations) * 1000) / 10
      : 0;

  const totalDecided = approvedTeams + rejectedTeams;
  const approvalRate =
    totalDecided > 0
      ? Math.round((approvedTeams / totalDecided) * 1000) / 10
      : 0;

  const judgingProgress =
    totalJudgeAssignments > 0
      ? Math.round((completedAssignments / totalJudgeAssignments) * 1000) / 10
      : 0;

  const totalPasswordTokens = pendingPasswordTokens + usedPasswordTokens;
  const passwordSetupRate =
    totalPasswordTokens > 0
      ? Math.round((usedPasswordTokens / totalPasswordTokens) * 1000) / 10
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          <BarChart3 className="mr-2 inline size-6 text-primary" />
          Event Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprehensive analytics for Anveshana 2026.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total People"
          value={totalUsers}
          icon={<Users className="size-5 text-primary" />}
        />
        <StatCard
          label="Total Teams"
          value={totalTeams}
          icon={<Users className="size-5 text-blue-500" />}
        />
        <StatCard
          label="RSVP Rate"
          value={`${rsvpRate}%`}
          icon={<TrendingUp className="size-5 text-green-500" />}
        />
        <StatCard
          label="Approval Rate"
          value={`${approvalRate}%`}
          icon={<CheckCircle className="size-5 text-emerald-500" />}
        />
      </div>

      {/* People Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              People Breakdown
            </CardTitle>
            <CardDescription>
              {totalUsers} total registered users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <BarRow
              label="Participants"
              count={participantCount}
              total={totalUsers}
              color="bg-primary"
            />
            <BarRow
              label="Volunteers"
              count={volunteerCount}
              total={totalUsers}
              color="bg-blue-500"
            />
            <BarRow
              label="Judges"
              count={judgeCount}
              total={totalUsers}
              color="bg-amber-500"
            />
            <BarRow
              label="Admins"
              count={adminCount}
              total={totalUsers}
              color="bg-purple-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-primary" />
              Account Status
            </CardTitle>
            <CardDescription>Password setup completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-green-500" />
                <span className="text-sm">Password Set Up</span>
              </div>
              <span className="text-lg font-bold">{usedPasswordTokens}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <span className="text-sm">Pending Setup</span>
              </div>
              <span className="text-lg font-bold">{pendingPasswordTokens}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Completion Rate:{" "}
              <span className="font-semibold text-foreground">
                {passwordSetupRate}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams & RSVPs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4 text-primary" />
              Team Status
            </CardTitle>
            <CardDescription>
              {totalTeams} total teams &middot; {recentRegistrations} in last 7
              days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {pendingTeams}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-green-500">
                  {approvedTeams}
                </p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-red-500">
                  {rejectedTeams}
                </p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-medium">{totalTeamMembers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team Leads</span>
                <span className="font-medium">{teamLeadCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Team Size</span>
                <span className="font-medium">{avgTeamSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Team Size Range
                </span>
                <span className="font-medium">
                  {minTeamSize} – {maxTeamSize}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-primary" />
              Invitation & RSVP Funnel
            </CardTitle>
            <CardDescription>
              {totalInvitations} invitations sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FunnelStep
              label="Invitations Sent"
              count={totalInvitations}
              total={totalInvitations}
              color="bg-blue-500"
            />
            <FunnelStep
              label="RSVPed (Used)"
              count={usedInvitations}
              total={totalInvitations}
              color="bg-green-500"
            />
            <FunnelStep
              label="Approved"
              count={approvedTeams}
              total={totalInvitations}
              color="bg-emerald-500"
            />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold text-amber-500">
                  {pendingInvitations}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending Invites
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-lg font-bold text-red-500">
                  {expiredInvitations}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expired Invites
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories & Logistics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" />
              Categories
            </CardTitle>
            <CardDescription>Team distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {teamsByCategory.length > 0 ? (
              <div className="space-y-3">
                {teamsByCategory.map((c) => (
                  <BarRow
                    key={c.category}
                    label={c.category ?? "Uncategorized"}
                    count={c._count.id}
                    total={totalTeams}
                    color="bg-primary"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No categories assigned yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-amber-500" />
              Logistics Requirements
            </CardTitle>
            <CardDescription>
              Infrastructure needs across teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <span className="text-sm">Power Outlet Needed</span>
              </div>
              <Badge variant="secondary">{teamsNeedingPower} teams</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Wifi className="size-4 text-blue-500" />
                <span className="text-sm">Internet Needed</span>
              </div>
              <Badge variant="secondary">{teamsNeedingInternet} teams</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-purple-500" />
                <span className="text-sm">Special Requirements</span>
              </div>
              <Badge variant="secondary">
                {teamsWithRequirements} teams
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Judging & Venue */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="size-4 text-primary" />
              Judging Progress
            </CardTitle>
            <CardDescription>
              {totalJudgeAssignments} total assignments &middot;{" "}
              {judgingProgress}% complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {scheduledAssignments}
                </p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {inProgressAssignments}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-green-500">
                  {completedAssignments}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
            {/* Progress bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{judgingProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${judgingProgress}%` }}
                />
              </div>
            </div>
            {judgeWorkload.length > 0 && (
              <div className="mt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Judge Workload ({judgeWorkload.length} judges)
                </p>
                <div className="space-y-1">
                  {judgeWorkload.map((j, i) => (
                    <div
                      key={j.judgeId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        Judge {i + 1}
                      </span>
                      <span className="font-medium">
                        {j._count.id} assignments
                        {j._avg.score != null && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (avg: {Math.round(j._avg.score * 100) / 100})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-primary" />
              Venue & Stalls
            </CardTitle>
            <CardDescription>
              Stall assignments & volunteer zones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {totalStallLocations}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stalls Assigned
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {totalVolunteerZones}
                </p>
                <p className="text-xs text-muted-foreground">
                  Volunteer Zones
                </p>
              </div>
            </div>
            {approvedTeams > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Stall Assignment Rate:{" "}
                <span className="font-semibold text-foreground">
                  {Math.round((totalStallLocations / approvedTeams) * 1000) /
                    10}
                  %
                </span>
              </div>
            )}
            {volunteerZoneDistribution.length > 0 && (
              <div className="mt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Zone Distribution
                </p>
                <div className="space-y-2">
                  {volunteerZoneDistribution.map((z) => (
                    <div
                      key={`${z.zoneName}-${z.building}-${z.floor}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm">
                        {z.zoneName}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({z.building}, Floor {z.floor})
                        </span>
                      </span>
                      <Badge variant="secondary">
                        {z._count.id} volunteer{z._count.id !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl sm:text-2xl">{value}</span>
          {icon}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {count}{" "}
          <span className="text-xs text-muted-foreground">
            ({Math.round(pct)}%)
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {count}{" "}
          <span className="text-xs text-muted-foreground">
            ({Math.round(pct)}%)
          </span>
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
