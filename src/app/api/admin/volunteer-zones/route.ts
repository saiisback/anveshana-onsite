import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/admin-handler";
import prisma from "@/lib/prisma";

const ROLE_VOLUNTEER = "VOLUNTEER";

const createSchema = z.object({
  volunteerId: z.string().min(1),
  zoneName: z.string().min(1),
  building: z.string().min(1),
  floor: z.number().int(),
});

export const GET = withAdmin(async () => {
  const zones = await prisma.volunteerZone.findMany({
    include: {
      volunteer: {
        select: { name: true, email: true },
      },
    },
    orderBy: { zoneName: "asc" },
  });

  return NextResponse.json(zones);
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { volunteerId, zoneName, building, floor } = parsed.data;

  // Verify volunteer exists and has VOLUNTEER role
  const volunteer = await prisma.user.findUnique({
    where: { id: volunteerId },
    select: { id: true, role: true },
  });

  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  if (volunteer.role !== ROLE_VOLUNTEER) {
    return NextResponse.json(
      { error: "User is not a volunteer" },
      { status: 400 }
    );
  }

  // Check for duplicate assignment
  const existing = await prisma.volunteerZone.findFirst({
    where: { volunteerId, zoneName },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Volunteer is already assigned to this zone" },
      { status: 409 }
    );
  }

  const zone = await prisma.volunteerZone.create({
    data: { volunteerId, zoneName, building, floor },
  });

  return NextResponse.json(zone, { status: 201 });
});
