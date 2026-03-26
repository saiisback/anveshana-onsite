import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { JudgesClient } from "./judges-client";

export default async function AdminJudgesPage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const [judges, teams, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "JUDGE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, stallNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.judgeAssignment.findMany({
      include: {
        judge: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true, stallNumber: true } },
      },
      orderBy: { timeSlotStart: "asc" },
    }),
  ]);

  const serializedAssignments = assignments.map((a) => ({
    id: a.id,
    judgeId: a.judgeId,
    teamId: a.teamId,
    judgeName: a.judge.name,
    judgeEmail: a.judge.email,
    teamName: a.team.name,
    stallNumber: a.team.stallNumber,
    timeSlotStart: a.timeSlotStart.toISOString(),
    timeSlotEnd: a.timeSlotEnd.toISOString(),
    status: a.status,
    score: a.score,
  }));

  return <JudgesClient judges={judges} teams={teams} assignments={serializedAssignments} />;
}
