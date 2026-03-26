import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { readFileSync } from "fs";
import { resolve } from "path";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1. Delete "dipshitters" team and related data
  console.log("\n--- Deleting 'dipshitters' team ---");
  const dipshitters = await prisma.team.findFirst({ where: { name: "dipshitters" } });
  if (dipshitters) {
    await prisma.teamMember.deleteMany({ where: { teamId: dipshitters.id } });
    await prisma.invitation.deleteMany({ where: { teamId: dipshitters.id } });
    await prisma.judgeAssignment.deleteMany({ where: { teamId: dipshitters.id } });
    await prisma.stallLocation.deleteMany({ where: { teamId: dipshitters.id } });
    await prisma.team.delete({ where: { id: dipshitters.id } });
    console.log("Deleted 'dipshitters' team and all related records.");
  } else {
    console.log("'dipshitters' not found, skipping.");
  }

  // 2. Parse CSV to build Team-ID → Display Name mapping
  const csvPath = resolve(__dirname, "../data/rsvp-details-2026-03-24 - rsvp-details-2026-03-24.csv.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").slice(1); // skip header

  const teamMap: Record<string, string> = {};

  for (const line of lines) {
    // Parse CSV respecting quoted fields
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const slNo = fields[0];
    const displayName = fields[1];
    const teamId = fields[2];

    // Only capture rows that have a Sl No (lead rows with display names)
    if (slNo && displayName && teamId && teamId.startsWith("Team-")) {
      teamMap[teamId] = displayName;
    }
  }

  console.log(`\n--- Parsed ${Object.keys(teamMap).length} team name mappings from CSV ---`);

  // 3. Update each team's name from Team-ID to display name
  console.log("\n--- Updating team display names ---");
  let updated = 0;
  let skipped = 0;

  const dbTeams = await prisma.team.findMany({ select: { id: true, name: true } });

  for (const team of dbTeams) {
    const displayName = teamMap[team.name];
    if (displayName) {
      await prisma.team.update({
        where: { id: team.id },
        data: { name: displayName },
      });
      console.log(`  ${team.name} → ${displayName}`);
      updated++;
    } else {
      console.log(`  ${team.name} — no display name in CSV, skipping`);
      skipped++;
    }
  }

  console.log(`\n--- Done: ${updated} updated, ${skipped} skipped ---`);

  // 4. Show final state
  const finalTeams = await prisma.team.findMany({
    select: { name: true, status: true },
    orderBy: { name: "asc" },
  });
  console.log(`\nFinal teams in DB (${finalTeams.length}):`);
  finalTeams.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} [${t.status}]`));

  await prisma.$disconnect();
}

main().catch(console.error);
