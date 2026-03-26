import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, prototypeTitle: true, status: true, category: true },
    orderBy: { name: "asc" },
  });

  console.log(JSON.stringify(teams, null, 2));
  console.log(`\nTotal teams in DB: ${teams.length}`);
  await prisma.$disconnect();
}

main();
