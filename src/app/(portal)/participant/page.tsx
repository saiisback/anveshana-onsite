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
  MapPin,
  Clock,
  Gavel,
  HelpCircle,
  Lock,
} from "lucide-react";

export default async function ParticipantDashboard() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              members: { include: { user: true } },
              judgeAssignments: {
                include: { judge: true },
                orderBy: { timeSlotStart: "asc" },
                take: 5,
              },
            },
          },
        },
      },
    },
  });

  const team = user?.teamMembers?.[0]?.team;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Welcome back, {session.user.name ?? "Participant"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is an overview of your team and upcoming schedule.
        </p>
      </div>

      {/* Stats — stacked on mobile, single row on desktop */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <Card>
          <CardHeader className="p-4 lg:p-6">
            <CardDescription>Team Name</CardDescription>
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
              <Users className="size-4 text-primary" />
              {team?.name ?? "Not assigned"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-4 lg:p-6">
            <CardDescription>Stall Number</CardDescription>
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
              <MapPin className="size-4 text-primary" />
              TBD
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-4 lg:p-6">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <Badge
                variant={
                  team?.status === "APPROVED" ? "default" : "secondary"
                }
              >
                {team?.status ?? "PENDING"}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Content cards - stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="size-4 text-primary" />
              Upcoming Judge Visits
            </CardTitle>
            <CardDescription>
              Scheduled evaluations for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            {team?.judgeAssignments && team.judgeAssignments.length > 0 ? (
              <div className="space-y-3">
                {team.judgeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {assignment.judge.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="mr-1 inline size-3" />
                        {new Date(assignment.timeSlotStart).toLocaleString(
                          "en-IN",
                          { dateStyle: "medium", timeStyle: "short" }
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{assignment.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No judge visits scheduled yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="size-4 text-orange-500" />
              Help Requests
              <Lock className="ml-auto size-3.5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Will open on the day of the event.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
