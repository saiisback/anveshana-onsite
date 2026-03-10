import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.status !== "PENDING") {
      return NextResponse.json(
        { error: "Team is not in PENDING status" },
        { status: 400 }
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({
      message: "Team rejected",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Reject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
