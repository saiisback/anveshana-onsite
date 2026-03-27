import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { generatePasswordSetupToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/resend";
import { passwordSetupEmail } from "@/lib/email-templates";
import { APP_URL, EVENT_NAME } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  teamId: z.string().min(1),
});

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, email, teamId } = schema.parse(body);

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, status: true },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          role: "PARTICIPANT",
        },
      });
      isNewUser = true;
    }

    // Check if already a member of this team
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: user.id },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    // Add to team
    await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        roleInTeam: "member",
      },
    });

    // Generate password setup token and send email (for new users or users without a password)
    if (isNewUser || !user.password) {
      // Expire existing pending tokens
      await prisma.passwordSetupToken.updateMany({
        where: { userId: user.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      });

      const setupToken = await generatePasswordSetupToken(user.id);
      const setupUrl = `${APP_URL}/set-password?token=${setupToken.token}`;

      await sendEmail({
        to: user.email,
        subject: `Set Your Password — ${EVENT_NAME}`,
        html: passwordSetupEmail(user.name, setupUrl),
      });
    }

    return NextResponse.json({
      message: `${user.name} added to ${team.name}${isNewUser || !user.password ? " and password setup link sent" : ""}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please fill in all fields with valid values" },
        { status: 400 }
      );
    }

    console.error("Add team member error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
