import crypto from "crypto";
import prisma from "@/lib/prisma";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function isTokenValid(token: { status: string; expiresAt: Date }): boolean {
  return token.status === "PENDING" && token.expiresAt >= new Date();
}

export async function generateInviteToken(email: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  const invitation = await prisma.invitation.create({
    data: { email, token, expiresAt },
  });

  return invitation;
}

export async function validateInviteToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation || !isTokenValid(invitation)) return null;

  return invitation;
}

export async function generatePasswordSetupToken(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

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

  if (!setupToken || !isTokenValid(setupToken)) return null;

  return setupToken;
}
