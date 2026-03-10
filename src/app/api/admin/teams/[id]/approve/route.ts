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

    // Find the next available stall number
    const lastStall = await prisma.team.findFirst({
      where: { stallNumber: { not: null } },
      orderBy: { stallNumber: "desc" },
      select: { stallNumber: true },
    });
    const nextStallNumber = (lastStall?.stallNumber ?? 0) + 1;

    // Generate QR code string using team ID
    const qrCode = `anveshana-team-${id}`;

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        status: "APPROVED",
        stallNumber: nextStallNumber,
        qrCode,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Team approved successfully",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
