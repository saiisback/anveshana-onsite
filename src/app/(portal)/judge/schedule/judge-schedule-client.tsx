"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Search } from "lucide-react";
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

type Assignment = {
  id: string;
  status: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  team: {
    name: string;
    prototypeTitle: string | null;
    stallNumber: number | null;
  };
};

export default function JudgeScheduleClient({
  assignments,
}: {
  assignments: Assignment[];
}) {
  const [search, setSearch] = useState("");

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.team.name.toLowerCase().includes(q) ||
      (a.team.stallNumber != null && String(a.team.stallNumber).includes(q))
    );
  });

  // Group filtered by date
  const grouped = new Map<string, Assignment[]>();
  for (const assignment of filtered) {
    const dateKey = new Date(assignment.timeSlotStart).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
    const existing = grouped.get(dateKey) ?? [];
    existing.push(assignment);
    grouped.set(dateKey, existing);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
            Full Schedule
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your judging assignments across all dates.
          </p>
        </div>
        {assignments.length > 0 && (
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search team or stall..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No assignments yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              You&apos;ll see your judging schedule here once assignments are made.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No teams matching &quot;{search}&quot;
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, dateAssignments]) => (
            <div key={date}>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-sm font-bold text-foreground">
                <Calendar className="size-4 text-primary" />
                {date}
              </h2>
              <div className="space-y-2">
                {dateAssignments.map((assignment) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
