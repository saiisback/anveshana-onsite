import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CalendarClock,
  MapPin,
  Mic,
  UtensilsCrossed,
  Gavel,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

interface TimelineItem {
  time: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  type: "event";
}

interface JudgeSlotItem {
  type: "judge-visits";
}

type ScheduleItem = TimelineItem | JudgeSlotItem;

const BEFORE_JUDGING: TimelineItem[] = [
  {
    time: "8:30 AM",
    title: "Registration Opens",
    description: "Arrive at the venue and head to the registration desk. Collect your Welcome Kit.",
    icon: Clock,
    color: "text-blue-500",
    type: "event",
  },
  {
    time: "After Registration",
    title: "Guided Navigation",
    description: "You will be guided to the Inaugural Ceremony or directly to the Prototype Zones based on your arrival timing.",
    icon: MapPin,
    color: "text-teal-500",
    type: "event",
  },
  {
    time: "Morning",
    title: "Inaugural Ceremony",
    description: "Formal function covering the event flow, judging evaluation metrics, and all important guidelines for the day.",
    icon: Mic,
    color: "text-purple-500",
    type: "event",
  },
  {
    time: "Throughout the Day",
    title: "Prototype Exhibition & Judging",
    description: "Present your prototype at your assigned stall. Track judge proximity via the app.",
    icon: Gavel,
    color: "text-orange-500",
    type: "event",
  },
];

const AFTER_JUDGING: TimelineItem[] = [
  {
    time: "Meal Times",
    title: "Food & Refreshments",
    description: "You will be notified through the app when food is ready. A volunteer will guide you to the food area.",
    icon: UtensilsCrossed,
    color: "text-green-500",
    type: "event",
  },
];

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

  const team = membership?.team;

  const assignments = team
    ? await prisma.judgeAssignment.findMany({
        where: { teamId: team.id },
        include: { judge: { select: { name: true } } },
        orderBy: { timeSlotStart: "asc" },
      })
    : [];

  // Build the full schedule: event items + judge visits inserted in between
  const schedule: ScheduleItem[] = [
    ...BEFORE_JUDGING,
    { type: "judge-visits" as const },
    ...AFTER_JUDGING,
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Event timeline &amp; your judge visits for March 27, 2026
          {team ? ` — ${team.name}${team.stallNumber ? ` (Stall ${team.stallNumber})` : ""}` : ""}
        </p>
      </div>

      {/* Unified Timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

        {schedule.map((item, idx) => {
          // Judge visits slot
          if (item.type === "judge-visits") {
            if (!team) return null;

            if (assignments.length === 0) {
              return (
                <Card key="judge-visits" className="relative ml-10 border-primary/20">
                  <div className="absolute -left-10 top-4 flex size-[38px] items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <UserCheck className="size-4 text-primary" />
                  </div>
                  <CardContent className="py-4">
                    <Badge variant="outline" className="mb-2 font-mono text-xs border-primary/30 text-primary">
                      Your Judge Visits
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="size-4 text-muted-foreground/50" />
                      No judge visits scheduled yet.
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return assignments.map((assignment, aIdx) => {
              const start = new Date(assignment.timeSlotStart);
              const end = new Date(assignment.timeSlotEnd);
              const style = STATUS_STYLES[assignment.status] ?? STATUS_STYLES.SCHEDULED;

              return (
                <Card key={assignment.id} className="relative ml-10 border-primary/20 bg-primary/[0.02]">
                  <div className="absolute -left-10 top-4 flex size-[38px] items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <UserCheck className="size-4 text-primary" />
                  </div>
                  <CardContent className="py-4">
                    {aIdx === 0 && (
                      <Badge variant="outline" className="mb-2 font-mono text-xs border-primary/30 text-primary">
                        Your Judge Visits
                      </Badge>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {assignment.judge.name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDate(start)} &middot; {formatTime(start)} – {formatTime(end)}
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
                    </div>
                  </CardContent>
                </Card>
              );
            });
          }

          // Regular event timeline item
          const Icon = item.icon;
          return (
            <Card key={item.title} className="relative ml-10">
              <div className="absolute -left-10 top-4 flex size-[38px] items-center justify-center rounded-full border border-border bg-background">
                <Icon className={`size-4 ${item.color}`} />
              </div>
              <CardContent className="py-4">
                <Badge variant="outline" className="mb-2 font-mono text-xs">
                  {item.time}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
