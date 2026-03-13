import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateInviteToken } from "@/lib/tokens";

const memberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

const registerSchema = z.object({
  token: z.string().min(1),
  leadName: z.string().min(2),
  leadPhone: z.string().min(10),
  members: z.array(memberSchema).max(3),
  powerOutlet: z.boolean(),
  internetNeeded: z.boolean(),
  tableSize: z.enum(["small", "medium", "large"]),
  additionalRequirements: z.string().max(300).optional(),
  paymentScreenshot: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    // Validate invitation token
    const invitation = await validateInviteToken(parsed.token);
    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation token" },
        { status: 400 }
      );
    }

    // Generate a short ID for team name
    const shortId = invitation.id.slice(-6).toUpperCase();

    const team = await prisma.$transaction(async (tx) => {
      // Create lead user (no password)
      const leadUser = await tx.user.upsert({
        where: { email: invitation.email },
        update: { name: parsed.leadName, phone: parsed.leadPhone },
        create: {
          name: parsed.leadName,
          email: invitation.email,
          emailVerified: true,
          phone: parsed.leadPhone,
          role: "PARTICIPANT",
        },
      });

      // Create additional member users (no password)
      const memberUsers = await Promise.all(
        parsed.members.map(async (member) => {
          return tx.user.upsert({
            where: { email: member.email },
            update: { name: member.name, phone: member.phone },
            create: {
              name: member.name,
              email: member.email,
              emailVerified: true,
              phone: member.phone,
              role: "PARTICIPANT",
            },
          });
        })
      );

      // Create team
      const createdTeam = await tx.team.create({
        data: {
          name: `Team-${shortId}`,
          status: "PENDING",
          powerOutlet: parsed.powerOutlet,
          internetNeeded: parsed.internetNeeded,
          tableSize: parsed.tableSize,
          additionalRequirements: parsed.additionalRequirements ?? null,
          paymentScreenshot: parsed.paymentScreenshot,
        },
      });

      // Create team members — lead first
      await tx.teamMember.create({
        data: {
          teamId: createdTeam.id,
          userId: leadUser.id,
          roleInTeam: "lead",
        },
      });

      for (const memberUser of memberUsers) {
        await tx.teamMember.create({
          data: {
            teamId: createdTeam.id,
            userId: memberUser.id,
            roleInTeam: "member",
          },
        });
      }

      // Mark invitation as used and link to team
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "USED", teamId: createdTeam.id },
      });

      return createdTeam;
    });

    return NextResponse.json(
      { message: "Team registered successfully", teamId: team.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
