import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hash } from "bcryptjs";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  const password = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@anveshana.in" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@anveshana.in",
      password,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  const volunteerPassword = await hash("volunteer123", 12);
  const volunteer = await prisma.user.upsert({
    where: { email: "volunteer@anveshana.in" },
    update: {},
    create: {
      name: "Volunteer 1",
      email: "volunteer@anveshana.in",
      password: volunteerPassword,
      role: "VOLUNTEER",
    },
  });
  console.log("Created volunteer user:", volunteer.email);

  const judgePassword = await hash("judge123", 12);
  const judge = await prisma.user.upsert({
    where: { email: "judge@anveshana.in" },
    update: {},
    create: {
      name: "Judge 1",
      email: "judge@anveshana.in",
      password: judgePassword,
      role: "JUDGE",
    },
  });
  console.log("Created judge user:", judge.email);

  console.log("Seeding complete!");
}

main().catch(console.error);
