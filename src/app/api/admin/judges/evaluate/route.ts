import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";

const scoreParam = z.number().min(0).max(10);

const evaluateSchema = z.object({
  assignmentId: z.string().min(1),
  scores: z.object({
    innovation: scoreParam,
    execution: scoreParam,
    marketFit: scoreParam,
    scalability: scoreParam,
    uniqueness: scoreParam,
    presentation: scoreParam,
  }),
});

const COMPLETED_STATUS = "COMPLETED" as const;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "JUDGE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = evaluateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { assignmentId, scores } = parsed.data;

  const assignment = await prisma.judgeAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (assignment.judgeId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Total score: sum of 6 params (max 60), scaled to 100
  const rawTotal =
    scores.innovation +
    scores.execution +
    scores.marketFit +
    scores.scalability +
    scores.uniqueness +
    scores.presentation;
  const scaledScore = Math.round((rawTotal / 60) * 100 * 100) / 100;

  const updated = await prisma.judgeAssignment.update({
    where: { id: assignmentId },
    data: {
      score: scaledScore,
      scoreBreakdown: scores,
      status: COMPLETED_STATUS,
    },
  });

  return NextResponse.json({
    message: "Evaluation submitted",
    assignment: updated,
    breakdown: scores,
    totalScore: scaledScore,
  });
}
