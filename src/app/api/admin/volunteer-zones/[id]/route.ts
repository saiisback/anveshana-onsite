import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/admin-handler";
import prisma from "@/lib/prisma";

const updateSchema = z.object({
  zoneName: z.string().min(1).optional(),
  building: z.string().min(1).optional(),
  floor: z.number().int().optional(),
});

export const PUT = withAdmin(
  async (request: Request, ctx: { params: Promise<Record<string, string>> }) => {
    const { id } = await ctx.params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.volunteerZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Zone assignment not found" }, { status: 404 });
    }

    const updated = await prisma.volunteerZone.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  }
);

export const DELETE = withAdmin(
  async (_request: Request, ctx: { params: Promise<Record<string, string>> }) => {
    const { id } = await ctx.params;

    const existing = await prisma.volunteerZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Zone assignment not found" }, { status: 404 });
    }

    await prisma.volunteerZone.delete({ where: { id } });

    return NextResponse.json({ success: true });
  }
);
