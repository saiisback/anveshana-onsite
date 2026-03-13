import prisma from "@/lib/prisma";
import { RegistrationsClient } from "./registrations-client";

export default async function AdminRegistrationsPage() {
  const pendingTeams = await prisma.team.findMany({
    where: { status: "PENDING" },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const teams = pendingTeams.map((team) => ({
    id: team.id,
    name: team.name,
    prototypeTitle: team.prototypeTitle,
    description: team.description,
    category: team.category,
    leadEmail:
      team.members.find((m) => m.roleInTeam === "lead")?.user.email ?? "—",
    membersCount: team.members.length,
    members: team.members.map((m) => ({
      name: m.user.name,
      email: m.user.email,
      roleInTeam: m.roleInTeam,
    })),
    powerOutlet: team.powerOutlet,
    internetNeeded: team.internetNeeded,
    tableSize: team.tableSize,
    additionalRequirements: team.additionalRequirements,
    paymentScreenshot: team.paymentScreenshot,
    createdAt: team.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Pending RSVPs
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and approve or reject team RSVPs
        </p>
      </div>
      <RegistrationsClient teams={teams} />
    </div>
  );
}
