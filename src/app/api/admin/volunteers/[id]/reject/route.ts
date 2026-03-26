import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";

export const POST = withAdmin(async (
  _request: Request,
  { params }: { params: Promise<Record<string, string>> }
) => {
  const { id } = await params;

  const volunteerRequest = await prisma.volunteerRequest.findUnique({
    where: { id },
  });

  if (!volunteerRequest) {
    return NextResponse.json(
      { error: "Volunteer request not found" },
      { status: 404 }
    );
  }

  if (volunteerRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request has already been processed" },
      { status: 400 }
    );
  }

  await prisma.volunteerRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  return NextResponse.json({ success: true });
});
