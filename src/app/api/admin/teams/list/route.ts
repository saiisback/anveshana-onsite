import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const teams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, stallNumber: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}
