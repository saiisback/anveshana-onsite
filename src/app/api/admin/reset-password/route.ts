import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { generatePasswordSetupToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/resend";
import { passwordResetEmail } from "@/lib/email-templates";
import { APP_URL, EVENT_NAME } from "@/lib/constants";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No user found with this email" },
        { status: 404 }
      );
    }

    // Expire any existing pending tokens for this user
    await prisma.passwordSetupToken.updateMany({
      where: { userId: user.id, status: "PENDING" },
      data: { status: "EXPIRED" },
    });

    // Generate new token
    const setupToken = await generatePasswordSetupToken(user.id);
    const resetUrl = `${APP_URL}/set-password?token=${setupToken.token}`;

    // Send email
    const result = await sendEmail({
      to: user.email,
      subject: `Reset Your Password — ${EVENT_NAME}`,
      html: passwordResetEmail(user.name, resetUrl),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Password reset link sent successfully",
      userName: user.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
