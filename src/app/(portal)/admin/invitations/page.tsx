import prisma from "@/lib/prisma";
import { InvitationsClient } from "./invitations-client";

export default async function AdminInvitationsPage() {
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { id: true, name: true, status: true } },
    },
  });

  const data = invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    status: inv.status,
    teamName: inv.team?.name ?? null,
    teamStatus: inv.team?.status ?? null,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
  }));

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Invitations
        </h1>
        <p className="text-sm text-muted-foreground">
          Invite team leads via email to register for Anveshana 2026
        </p>
      </div>
      <InvitationsClient invitations={data} />
    </div>
  );
}
