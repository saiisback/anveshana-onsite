import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";
import { hash } from "bcryptjs";

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const { teamName, category, leadName, leadEmail, leadPhone, password } = body;

  if (!teamName || !leadName || !leadEmail || !password) {
    return NextResponse.json(
      { error: "teamName, leadName, leadEmail, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  // Check if team already exists
  const existingTeam = await prisma.team.findFirst({
    where: { name: teamName },
  });
  if (existingTeam) {
    return NextResponse.json(
      { error: `Team "${teamName}" already exists` },
      { status: 409 }
    );
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: leadEmail },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: `User with email "${leadEmail}" already exists` },
      { status: 409 }
    );
  }

  const hashedPassword = await hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    // Get next stall number
    const lastStall = await tx.team.findFirst({
      where: { stallNumber: { not: null } },
      orderBy: { stallNumber: "desc" },
      select: { stallNumber: true },
    });
    const nextStallNumber = (lastStall?.stallNumber ?? 0) + 1;

    // Create team
    const team = await tx.team.create({
      data: {
        name: teamName,
        category: category || null,
        status: "APPROVED",
        stallNumber: nextStallNumber,
        qrCode: `anveshana-team-manual`,
      },
    });

    // Update qrCode with actual team ID
    await tx.team.update({
      where: { id: team.id },
      data: { qrCode: `anveshana-team-${team.id}` },
    });

    // Create lead user
    const user = await tx.user.create({
      data: {
        name: leadName,
        email: leadEmail,
        emailVerified: true,
        password: hashedPassword,
        role: "PARTICIPANT",
      },
    });

    // Create credential account for BetterAuth
    await tx.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    // Create team member (lead)
    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        roleInTeam: "lead",
      },
    });

    return { team, user };
  });

  return NextResponse.json({
    message: `Team "${teamName}" registered successfully`,
    team: {
      id: result.team.id,
      name: result.team.name,
      category: result.team.category,
      stallNumber: result.team.stallNumber,
    },
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
  });
});
