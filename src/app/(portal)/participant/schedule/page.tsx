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
import { Clock, CalendarClock } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

function formatTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-IN", { dateStyle: "medium" });
}

export default async function ParticipantSchedulePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: { team: true },
  });

  if (!membership) {
    return (
      <div className="space-y-5">
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Judge Visit Schedule
        </h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You&apos;re not part of a team.
          </CardContent>
        </Card>
      </div>
    );
  }

  const team = membership.team;

  const assignments = await prisma.judgeAssignment.findMany({
    where: { teamId: team.id },
    include: { judge: { select: { name: true } } },
    orderBy: { timeSlotStart: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Judge Visit Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduled judge evaluations for {team.name}
          {team.stallNumber ? ` (Stall ${team.stallNumber})` : ""}
        </p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CalendarClock className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            No judge visits scheduled yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const start = new Date(assignment.timeSlotStart);
            const end = new Date(assignment.timeSlotEnd);
            const style = STATUS_STYLES[assignment.status] ?? STATUS_STYLES.SCHEDULED;

            return (
              <Card key={assignment.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {assignment.judge.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDate(start)} &middot; {formatTime(start)} –{" "}
                      {formatTime(end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.status === "COMPLETED" &&
                      assignment.score != null && (
                        <Badge variant="outline">
                          Score: {assignment.score}
                        </Badge>
                      )}
                    <Badge variant="outline" className={style.className}>
                      {style.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
