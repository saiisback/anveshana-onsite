import prisma from "@/lib/prisma";
import { RegisterClient } from "./register-client";

// These teams exist in the masterlist but haven't registered through the platform
const UNREGISTERED_TEAMS = [
  {
    teamName: "Scuffed Engineering",
    category: "Hardware",
    leadName: "Sameer Guruprasad Belthur",
    leadPhone: "918197170918",
    suggestedEmail: "sameer.guruprasad@outlook.com",
  },
  {
    teamName: "Tesla Core",
    category: "Hardware",
    leadName: "Saquib Pasha",
    leadPhone: "919916137866",
    suggestedEmail: "saquibpashaee@gmail.com",
  },
  {
    teamName: "Mavericks",
    category: "Software",
    leadName: "Vaibhav Pandey",
    leadPhone: "",
    suggestedEmail: "",
  },
];

export default async function AdminRegisterPage() {
  // Check which teams already exist in DB
  const existingTeams = await prisma.team.findMany({
    where: {
      name: { in: UNREGISTERED_TEAMS.map((t) => t.teamName) },
    },
    select: { name: true },
  });

  const existingNames = new Set(existingTeams.map((t) => t.name));

  const teams = UNREGISTERED_TEAMS.map((t) => ({
    ...t,
    alreadyRegistered: existingNames.has(t.teamName),
  }));

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Register Teams
        </h1>
        <p className="text-sm text-muted-foreground">
          Manually register teams that haven&apos;t signed up through the
          platform
        </p>
      </div>
      <RegisterClient teams={teams} />
    </div>
  );
}
