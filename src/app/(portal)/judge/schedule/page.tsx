import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import JudgeScheduleClient from "./judge-schedule-client";

export default async function JudgeSchedulePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: session.user.id },
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

  return <JudgeScheduleClient assignments={serialized} />;
}
