import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  roleInTeam: z.string().optional(),
});

const registerSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  prototypeTitle: z.string().min(1, "Prototype title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  requirements: z.string().optional(),
  members: z
    .array(memberSchema)
    .min(1, "At least one team member is required"),
});

const DEFAULT_PASSWORD = "anveshana2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    const existingTeam = await prisma.team.findUnique({
      where: { name: parsed.teamName },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

    const team = await prisma.$transaction(async (tx) => {
      // Create User records for each member
      const users = await Promise.all(
        parsed.members.map(async (member) => {
          const existingUser = await tx.user.findUnique({
            where: { email: member.email },
          });

          if (existingUser) {
            return existingUser;
          }

          const user = await tx.user.create({
            data: {
              name: member.name,
              email: member.email,
              emailVerified: true,
              phone: member.phone ?? null,
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

          return user;
        })
      );

      // Create Team record
      const createdTeam = await tx.team.create({
        data: {
          name: parsed.teamName,
          prototypeTitle: parsed.prototypeTitle,
          description: parsed.description,
          category: parsed.category,
          requirements: parsed.requirements ?? null,
          status: "PENDING",
        },
      });

      // Create TeamMember records - first member is the lead
      await Promise.all(
        users.map((user, index) =>
          tx.teamMember.create({
            data: {
              teamId: createdTeam.id,
              userId: user.id,
              roleInTeam:
                index === 0
                  ? "lead"
                  : parsed.members[index].roleInTeam || "member",
            },
          })
        )
      );

      return tx.team.findUnique({
        where: { id: createdTeam.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "Team registered successfully", team },
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
