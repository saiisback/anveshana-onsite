import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import JudgeDashboardClient from "./judge-dashboard-client";

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

  const serialized = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    timeSlotStart: a.timeSlotStart.toISOString(),
    timeSlotEnd: a.timeSlotEnd.toISOString(),
    team: a.team,
  }));

  return (
    <JudgeDashboardClient
      assignments={serialized}
      userName={session.user.name ?? "Judge"}
    />
  );
}
