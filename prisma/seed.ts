import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hash } from "bcryptjs";

neonConfig.webSocketConstructor = ws;

async function createUserWithAccount(
  prisma: PrismaClient,
  data: { name: string; email: string; password: string; role: string }
) {
  const hashedPassword = await hash(data.password, 12);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: {
      name: data.name,
      email: data.email,
      emailVerified: true,
      password: hashedPassword,
      role: data.role as "ADMIN" | "VOLUNTEER" | "JUDGE" | "PARTICIPANT",
    },
  });

  // Create credential account for BetterAuth
  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
  }

  return user;
}

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  // Delete all existing judge, volunteer, and admin users and their related data
  console.log("Cleaning up existing users...");

  // Delete sessions, accounts, password setup tokens for non-participant users
  const usersToDelete = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "JUDGE", "VOLUNTEER"] },
    },
    select: { id: true, email: true },
  });

  if (usersToDelete.length > 0) {
    const userIds = usersToDelete.map((u) => u.id);
    await prisma.passwordSetupToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.judgeAssignment.deleteMany({ where: { judgeId: { in: userIds } } });
    await prisma.volunteerZone.deleteMany({ where: { volunteerId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`Deleted ${usersToDelete.length} existing admin/judge/volunteer users:`, usersToDelete.map((u) => u.email));
  }

  // Create the single admin account
  const admin = await createUserWithAccount(prisma, {
    name: "IIC BICEP Admin",
    email: "iicbicep@bmsit.in",
    password: "iicbicep2026",
    role: "ADMIN",
  });
  console.log("Created admin user:", admin.email);

  console.log("Seeding complete!");
}

main().catch(console.error);
