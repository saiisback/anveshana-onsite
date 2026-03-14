import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // List all teams with their members
  const allTeams = await prisma.team.findMany({ include: { members: { include: { user: { select: { name: true, email: true } } } } } });
  console.log("All teams with members:", JSON.stringify(allTeams.map(t => ({ id: t.id, name: t.name, members: t.members.map(m => ({ name: m.user.name, email: m.user.email, role: m.roleInTeam })) })), null, 2));

  // List all users
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}
main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
