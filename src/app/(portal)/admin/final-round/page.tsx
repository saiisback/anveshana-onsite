import prisma from "@/lib/prisma";
import { FinalRoundClient } from "./final-round-client";

export default async function FinalRoundPage() {
  const teams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, stallNumber: true },
    orderBy: { stallNumber: "asc" },
  });

  return <FinalRoundClient teams={teams} />;
}
