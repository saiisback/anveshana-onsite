import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-handler";
import { generatePasswordSetupToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/resend";
import { volunteerApprovedEmail } from "@/lib/email-templates";

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

  // Check if user already exists
  const volunteerEmail = volunteerRequest.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: volunteerEmail },
  });

  if (existingUser) {
    // Update request status and return error
    await prisma.volunteerRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );
  }

  // Create user and update request in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create new volunteer user
    const user = await tx.user.create({
      data: {
        name: volunteerRequest.name,
        email: volunteerEmail,
        role: "VOLUNTEER",
      },
    });

    // Update request status
    await tx.volunteerRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Generate password setup token
    const setupToken = await generatePasswordSetupToken(user.id, tx);

    return { user, setupToken };
  });

  // Send approval email with password setup link
  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/set-password?token=${result.setupToken.token}`;

  await sendEmail({
    to: volunteerRequest.email,
    subject: "Welcome to Anveshana - Set Up Your Volunteer Account",
    html: volunteerApprovedEmail(volunteerRequest.name, setupUrl),
  });

  return NextResponse.json({ success: true, userId: result.user.id });
});
