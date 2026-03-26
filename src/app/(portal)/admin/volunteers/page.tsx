import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { VolunteersClient } from "./volunteers-client";

export default async function AdminVolunteersPage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const requests = await prisma.volunteerRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Volunteer Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage volunteer registration requests
        </p>
      </div>

      <VolunteersClient requests={requests} />
    </div>
  );
}
