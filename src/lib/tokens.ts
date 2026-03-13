import crypto from "crypto";
import prisma from "@/lib/prisma";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function generateInviteToken(email: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: { email, token, expiresAt },
  });

  return invitation;
}

export async function validateInviteToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) return null;
  if (invitation.status !== "PENDING") return null;
  if (invitation.expiresAt < new Date()) return null;

  return invitation;
}

export async function generatePasswordSetupToken(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const setupToken = await prisma.passwordSetupToken.create({
    data: { token, userId, expiresAt },
  });

  return setupToken;
}

export async function validatePasswordSetupToken(token: string) {
  const setupToken = await prisma.passwordSetupToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!setupToken) return null;
  if (setupToken.status !== "PENDING") return null;
  if (setupToken.expiresAt < new Date()) return null;

  return setupToken;
}
