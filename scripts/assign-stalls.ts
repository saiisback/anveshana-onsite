import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Stall assignments from the distribution plan
// Each stall has 2 teams (some have 1)
const STALL_ASSIGNMENTS: Record<number, string[]> = {
  1: ["PITCH PERFECT", "Baymax"],
  2: ["HearWell", "ThermaLogic"],
  3: ["Ignitron", "Concept Crew"],
  4: ["Team AD", "LARK Gen-1"],
  5: ["Hackstreet Boys", "LuminaForge"],
  6: ["NEURAL NINJAS", "IntruderX"],
  7: ["Elevate", "Aether Wings"],
  8: ["TIPS", "Technovators"],
  9: ["HeX", "GARUDA"],
  10: ["Medi Bridge", "FaultLine"],
  11: ["GENESIS", "Code Cluster"],
  12: ["Fulcrum", "Four-Sight"],
  13: ["Agro4", "AGRONOVA"],
  14: ["Alpha", "MSN"],
  15: ["Chill_Guyzzz™", "geekhogs"],
  16: ["Insight Syndicate", "No Signal"],
  17: ["Neural Nomads", "MEDIC4"],
  18: ["Snorlax", "Kirthana J L"],
  19: ["Neuron", "Team Astrax"],
  20: ["HASSIN", "Pothole Patrol"],
  21: ["BoredMass", "Wi - Fight Club"],
  22: ["DeFi Syndicates", "Signotech"],
  23: ["Pineapples"],
  24: ["Sethikarmansingh"],
  25: ["rsdiwagar"],
};

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Get all approved teams
  const allTeams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    select: { id: true, name: true, stallNumber: true },
  });

  console.log(`Found ${allTeams.length} approved teams in DB\n`);

  // Clear all existing stall numbers first
  await prisma.team.updateMany({
    where: { stallNumber: { not: null } },
    data: { stallNumber: null },
  });
  console.log("Cleared all existing stall numbers\n");

  // Build a map of team name (lowercase) -> team record for fuzzy matching
  const teamsByName = new Map<string, typeof allTeams[0]>();
  for (const team of allTeams) {
    teamsByName.set(team.name.toLowerCase(), team);
  }

  let updated = 0;
  let notFound: string[] = [];

  for (const [stallNum, teamNames] of Object.entries(STALL_ASSIGNMENTS)) {
    for (const teamName of teamNames) {
      // Try exact match first, then case-insensitive
      let team = allTeams.find((t) => t.name === teamName);
      if (!team) {
        team = teamsByName.get(teamName.toLowerCase());
      }
      // Try partial match (contains)
      if (!team) {
        team = allTeams.find(
          (t) =>
            t.name.toLowerCase().includes(teamName.toLowerCase()) ||
            teamName.toLowerCase().includes(t.name.toLowerCase())
        );
      }

      if (!team) {
        notFound.push(`Stall ${stallNum}: "${teamName}" - NOT FOUND in DB`);
        continue;
      }

      await prisma.team.update({
        where: { id: team.id },
        data: { stallNumber: Number(stallNum) },
      });

      console.log(`  Stall ${String(stallNum).padStart(2)}: ${team.name}`);
      updated++;
    }
  }

  console.log(`\n=== Updated ${updated} teams ===\n`);

  if (notFound.length > 0) {
    console.log("=== Teams NOT FOUND ===\n");
    for (const msg of notFound) {
      console.log(`  ${msg}`);
    }
  }

  // Show teams that didn't get a stall
  const unassigned = await prisma.team.findMany({
    where: { status: "APPROVED", stallNumber: null },
    select: { name: true },
  });

  if (unassigned.length > 0) {
    console.log(`\n=== ${unassigned.length} approved teams without stalls ===\n`);
    for (const t of unassigned) {
      console.log(`  - ${t.name}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
