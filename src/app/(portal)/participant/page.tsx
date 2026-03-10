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
  FlaskConical,
  MapPin,
  Clock,
  Gavel,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session.user.name ?? "Participant"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is an overview of your team and upcoming schedule.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Team Name</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-indigo-500" />
              {team?.name ?? "Not assigned"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Prototype</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-indigo-500" />
              {team?.prototypeTitle ?? "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Stall Number</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-indigo-500" />
              {team?.stallNumber ? `Stall #${team.stallNumber}` : "TBD"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="size-4 text-indigo-500" />
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
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {assignment.judge.name}
                      </p>
                      <p className="text-xs text-slate-500">
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
              <p className="text-sm text-slate-500">
                No judge visits scheduled yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4 text-orange-500" />
              Help Requests
            </CardTitle>
            <CardDescription>
              Need help? Raise a request for volunteers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/participant/help"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <HelpCircle className="size-4" />
              Raise Help Request
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
