import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";

const updateAssignmentSchema = z.object({
  timeSlotStart: z.string().datetime().optional(),
  timeSlotEnd: z.string().datetime().optional(),
  judgeId: z.string().min(1).optional(),
  teamId: z.string().min(1).optional(),
});

export const PUT = withAdmin(
  async (
    request: Request,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id } = await params;

    const assignment = await prisma.judgeAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const newStart = data.timeSlotStart ? new Date(data.timeSlotStart) : assignment.timeSlotStart;
    const newEnd = data.timeSlotEnd ? new Date(data.timeSlotEnd) : assignment.timeSlotEnd;
    const newJudgeId = data.judgeId ?? assignment.judgeId;

    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: "Invalid time range: end must be after start" },
        { status: 400 }
      );
    }

    // Check for time conflicts (excluding this assignment)
    const conflict = await prisma.judgeAssignment.findFirst({
      where: {
        id: { not: id },
        judgeId: newJudgeId,
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

    const updated = await prisma.judgeAssignment.update({
      where: { id },
      data: {
        ...(data.timeSlotStart && { timeSlotStart: newStart }),
        ...(data.timeSlotEnd && { timeSlotEnd: newEnd }),
        ...(data.judgeId && { judgeId: data.judgeId }),
        ...(data.teamId && { teamId: data.teamId }),
      },
    });

    return NextResponse.json({ message: "Assignment updated", assignment: updated });
  }
);

export const DELETE = withAdmin(
  async (
    _request: Request,
    { params }: { params: Promise<Record<string, string>> }
  ) => {
    const { id } = await params;

    const assignment = await prisma.judgeAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.judgeAssignment.delete({ where: { id } });

    return NextResponse.json({ message: "Assignment deleted" });
  }
);
