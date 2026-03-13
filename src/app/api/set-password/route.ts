import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validatePasswordSetupToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = schema.parse(body);

    const setupToken = await validatePasswordSetupToken(token);
    if (!setupToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: setupToken.userId },
        data: { password: hashedPassword },
      });

      // Create BetterAuth Account record for credential login
      const existingAccount = await tx.account.findFirst({
        where: {
          userId: setupToken.userId,
          providerId: "credential",
        },
      });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await tx.account.create({
          data: {
            userId: setupToken.userId,
            accountId: setupToken.userId,
            providerId: "credential",
            password: hashedPassword,
          },
        });
      }

      // Mark token as used
      await tx.passwordSetupToken.update({
        where: { id: setupToken.id },
        data: { status: "USED" },
      });
    });

    return NextResponse.json({ message: "Password set successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
