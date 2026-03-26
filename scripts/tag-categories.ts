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

  // Parse masterlist CSV
  const csvPath = resolve(__dirname, "../data/hackathon_masterlist - Masterlist.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").slice(1); // skip header

  const categoryMap: Record<string, string> = {};

  for (const line of lines) {
    if (!line.trim()) continue;
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

    // Columns: #, Team Name, Members, Category, ...
    const teamName = fields[1];
    const category = fields[3]; // "Hardware" or "Software"

    if (teamName && category) {
      categoryMap[teamName] = category;
    }
  }

  console.log(`Parsed ${Object.keys(categoryMap).length} category mappings from masterlist`);
  const hwCount = Object.values(categoryMap).filter(c => c === "Hardware").length;
  const swCount = Object.values(categoryMap).filter(c => c === "Software").length;
  console.log(`  Hardware: ${hwCount}, Software: ${swCount}\n`);

  // Update each team's category
  const dbTeams = await prisma.team.findMany({ select: { id: true, name: true, category: true } });

  let updated = 0;
  let notFound = 0;

  for (const team of dbTeams) {
    const category = categoryMap[team.name];
    if (category) {
      await prisma.team.update({
        where: { id: team.id },
        data: { category },
      });
      console.log(`  ${team.name} → ${category}`);
      updated++;
    } else {
      console.log(`  ${team.name} — NOT in masterlist, skipping`);
      notFound++;
    }
  }

  console.log(`\n--- Done: ${updated} tagged, ${notFound} not in masterlist ---`);

  // Summary
  const hw = await prisma.team.count({ where: { category: "Hardware" } });
  const sw = await prisma.team.count({ where: { category: "Software" } });
  const none = await prisma.team.count({ where: { category: null } });
  console.log(`\nDB Summary: ${hw} Hardware, ${sw} Software, ${none} untagged`);

  await prisma.$disconnect();
}

main().catch(console.error);
