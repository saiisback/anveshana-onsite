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
import { Gavel, CheckCircle, Clock, ListChecks } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default async function JudgeDashboard() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const assignments = await prisma.judgeAssignment.findMany({
    where: {
      judgeId: session.user.id,
    },
    include: {
      team: {
        select: {
          name: true,
          prototypeTitle: true,
          stallNumber: true,
        },
      },
    },
    orderBy: { timeSlotStart: "asc" },
  });

  const totalAssigned = assignments.length;
  const completed = assignments.filter((a) => a.status === "COMPLETED").length;
  const remaining = totalAssigned - completed;

  const stats = [
    {
      label: "Total Assigned",
      value: totalAssigned,
      icon: <ListChecks className="size-5 text-primary" />,
    },
    {
      label: "Completed",
      value: completed,
      icon: <CheckCircle className="size-5 text-green-500" />,
    },
    {
      label: "Remaining",
      value: remaining,
      icon: <Clock className="size-5 text-orange-500" />,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s your judging overview for today.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="transition-shadow hover:shadow-md hover:shadow-primary/5">
            <CardHeader className="p-4 sm:p-6">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl">{stat.value}</span>
                {stat.icon}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-base font-bold text-foreground">
          <Gavel className="size-4 text-primary" />
          Today&apos;s Schedule
        </h2>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Gavel className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                No assignments for today
              </p>
              <p className="text-sm text-muted-foreground/70">
                Check your{" "}
                <Link href="/judge/schedule" className="text-primary hover:underline">
                  full schedule
                </Link>{" "}
                for upcoming evaluations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/judge/evaluate/${assignment.id}`}
              >
                <Card className="transition-colors hover:bg-muted/30">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm">
                          {assignment.team.name}
                        </CardTitle>
                        {assignment.team.stallNumber != null && (
                          <CardDescription className="mt-0.5">
                            Stall #{assignment.team.stallNumber}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(assignment.timeSlotStart).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                          })}
                          {" – "}
                          {new Date(assignment.timeSlotEnd).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[assignment.status] ?? ""}
                        >
                          {STATUS_LABELS[assignment.status] ?? assignment.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
