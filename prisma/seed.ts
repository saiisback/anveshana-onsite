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

  const admin = await createUserWithAccount(prisma, {
    name: "Admin",
    email: "admin@anveshana.in",
    password: "admin123",
    role: "ADMIN",
  });
  console.log("Created admin user:", admin.email);

  const volunteer = await createUserWithAccount(prisma, {
    name: "Volunteer 1",
    email: "volunteer@anveshana.in",
    password: "volunteer123",
    role: "VOLUNTEER",
  });
  console.log("Created volunteer user:", volunteer.email);

  const judge = await createUserWithAccount(prisma, {
    name: "Judge 1",
    email: "judge@anveshana.in",
    password: "judge123",
    role: "JUDGE",
  });
  console.log("Created judge user:", judge.email);

  console.log("Seeding complete!");
}

main().catch(console.error);
