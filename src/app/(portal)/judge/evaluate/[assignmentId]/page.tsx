import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { EvaluateClient } from "./evaluate-client";

interface Props {
  params: Promise<{ assignmentId: string }>;
}

export default async function EvaluatePage({ params }: Props) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const { assignmentId } = await params;

  const assignment = await prisma.judgeAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      team: {
        select: {
          name: true,
          prototypeTitle: true,
          description: true,
          category: true,
          stallNumber: true,
          members: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!assignment || assignment.judgeId !== session.user.id) {
    notFound();
  }

  const teamData = {
    name: assignment.team.name,
    prototypeTitle: assignment.team.prototypeTitle,
    description: assignment.team.description,
    category: assignment.team.category,
    stallNumber: assignment.team.stallNumber,
    members: assignment.team.members.map((m) => m.user.name),
  };

  return (
    <EvaluateClient
      assignmentId={assignment.id}
      status={assignment.status}
      existingScore={assignment.score}
      timeSlotStart={assignment.timeSlotStart.toISOString()}
      timeSlotEnd={assignment.timeSlotEnd.toISOString()}
      team={teamData}
    />
  );
}
