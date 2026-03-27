import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email: rawEmail } = parsed.data;
    const email = rawEmail.toLowerCase();

    // Check if email already exists in volunteer requests
    const existingRequest = await prisma.volunteerRequest.findUnique({
      where: { email },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "A request with this email is already pending review" },
          { status: 400 }
        );
      }
      if (existingRequest.status === "APPROVED") {
        return NextResponse.json(
          { error: "This email has already been approved. Check your email for login instructions." },
          { status: 400 }
        );
      }
      // If rejected, allow re-submission by updating the existing record
      await prisma.volunteerRequest.update({
        where: { email },
        data: { name, status: "PENDING" },
      });
      return NextResponse.json({ success: true, resubmitted: true });
    }

    // Check if email already exists as a user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create new volunteer request
    await prisma.volunteerRequest.create({
      data: { name, email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Volunteer registration error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
