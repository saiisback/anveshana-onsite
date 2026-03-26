import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";

const createAssignmentsSchema = z.object({
  assignments: z.array(
    z.object({
      judgeId: z.string().min(1),
      teamId: z.string().min(1),
      timeSlotStart: z.string().datetime(),
      timeSlotEnd: z.string().datetime(),
    })
  ).min(1),
});

export const GET = withAdmin(async () => {
  const judges = await prisma.user.findMany({
    where: { role: "JUDGE" },
    include: {
      judgeAssignments: {
        select: { status: true, score: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = judges.map((judge) => {
    const assignments = judge.judgeAssignments;
    const completed = assignments.filter((a) => a.status === "COMPLETED");
    const scores = completed.map((a) => a.score).filter((s): s is number => s !== null);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      totalAssignments: assignments.length,
      completedAssignments: completed.length,
      averageScore,
    };
  });

  return NextResponse.json(result);
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const parsed = createAssignmentsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { assignments } = parsed.data;

  // Check for time conflicts
  for (const assignment of assignments) {
    const newStart = new Date(assignment.timeSlotStart);
    const newEnd = new Date(assignment.timeSlotEnd);

    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: `Invalid time range: end must be after start` },
        { status: 400 }
      );
    }

    const conflict = await prisma.judgeAssignment.findFirst({
      where: {
        judgeId: assignment.judgeId,
        timeSlotStart: { lt: newEnd },
        timeSlotEnd: { gt: newStart },
      },
      include: { team: { select: { name: true } } },
    });

    if (conflict) {
      return NextResponse.json(
        {
          error: `Time conflict: judge is already assigned to team "${conflict.team.name}" during this time slot`,
        },
        { status: 409 }
      );
    }
  }

  const created = await prisma.judgeAssignment.createMany({
    data: assignments.map((a) => ({
      judgeId: a.judgeId,
      teamId: a.teamId,
      timeSlotStart: new Date(a.timeSlotStart),
      timeSlotEnd: new Date(a.timeSlotEnd),
    })),
  });

  return NextResponse.json({ message: "Assignments created", count: created.count });
});
