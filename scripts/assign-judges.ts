import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { hash } from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const SLOT_DURATION_MIN = 10;

// Event day: today's date, judging starts at 10:30 AM IST
const today = new Date();
const EVENT_DATE = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 0);

const JUDGES = [
  { name: "Swaroop", email: "swaroop@anveshana.com", expertise: "SW" },
  { name: "Neeraj", email: "neeraj@anveshana.com", expertise: "SW" },
  { name: "Santosh", email: "santosh@anveshana.com", expertise: "SW" },
  { name: "Harish", email: "harish@anveshana.com", expertise: "HW" },
];

const DEFAULT_PASSWORD = "judge2026";

// Reserved assignments for unregistered teams (to be added later)
const RESERVED = {
  "Scuffed Engineering": { category: "Hardware", judges: ["Harish", "Swaroop"] },
  "Tesla Core": { category: "Hardware", judges: ["Harish", "Neeraj"] },
  "Mavericks": { category: "Software", judges: ["Swaroop", "Santosh"] },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // 1. Create judge accounts
  console.log("=== Creating Judge Accounts ===\n");
  const hashedPassword = await hash(DEFAULT_PASSWORD, 12);
  const judgeUsers: Record<string, string> = {}; // name -> userId

  for (const judge of JUDGES) {
    // Delete existing judge with this email if any
    const existing = await prisma.user.findUnique({ where: { email: judge.email } });
    if (existing) {
      await prisma.judgeAssignment.deleteMany({ where: { judgeId: existing.id } });
      await prisma.session.deleteMany({ where: { userId: existing.id } });
      await prisma.account.deleteMany({ where: { userId: existing.id } });
      await prisma.passwordSetupToken.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    const user = await prisma.user.create({
      data: {
        name: judge.name,
        email: judge.email,
        emailVerified: true,
        password: hashedPassword,
        role: "JUDGE",
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    judgeUsers[judge.name] = user.id;
    console.log(`  Created: ${judge.name} (${judge.email}) [${judge.expertise}]`);
  }

  // 2. Get all teams by category
  const allTeams = await prisma.team.findMany({
    where: { status: "APPROVED", NOT: { name: { startsWith: "Team-" } } },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  const hwTeams = shuffle(allTeams.filter((t) => t.category === "Hardware"));
  const swTeams = shuffle(allTeams.filter((t) => t.category === "Software"));

  console.log(`\n=== Teams: ${hwTeams.length} HW + ${swTeams.length} SW = ${allTeams.length} ===\n`);

  // 3. Build assignments following updated allocation (15 HW, 35 SW)
  // Harish (HW): all 15 HW + 10 SW = 25
  // Swaroop (SW): 8 HW + 17 SW = 25
  // Neeraj (SW): 7 HW + 18 SW = 25
  // Santosh (SW): 0 HW + 25 SW = 25

  const assignments: Record<string, { teamId: string; teamName: string }[]> = {
    Harish: [],
    Swaroop: [],
    Neeraj: [],
    Santosh: [],
  };

  // --- HW teams: each gets Harish + one of {Swaroop, Neeraj} ---
  // Split: 8 to Swaroop, 7 to Neeraj
  const hwForSwaroop = hwTeams.slice(0, 8);
  const hwForNeeraj = hwTeams.slice(8); // remaining 7

  for (const team of hwTeams) {
    assignments.Harish.push({ teamId: team.id, teamName: team.name });
  }
  for (const team of hwForSwaroop) {
    assignments.Swaroop.push({ teamId: team.id, teamName: team.name });
  }
  for (const team of hwForNeeraj) {
    assignments.Neeraj.push({ teamId: team.id, teamName: team.name });
  }

  // --- SW teams: each gets exactly 2 judges ---
  // Harish: 10 SW, Swaroop: 17 SW, Neeraj: 18 SW, Santosh: 25 SW
  // Total SW evals: 10 + 17 + 18 + 25 = 70 = 35 × 2 ✓

  // Use a counter-based approach
  const swTargets: Record<string, number> = { Harish: 10, Swaroop: 17, Neeraj: 18, Santosh: 25 };
  const swCounts: Record<string, number> = { Harish: 0, Swaroop: 0, Neeraj: 0, Santosh: 0 };
  const swJudgeOrder = ["Santosh", "Swaroop", "Neeraj", "Harish"]; // fill most-needed first

  for (const team of swTeams) {
    // Pick 2 judges with most remaining capacity
    const available = swJudgeOrder
      .filter((j) => swCounts[j] < swTargets[j])
      .sort((a, b) => (swTargets[b] - swCounts[b]) - (swTargets[a] - swCounts[a]));

    const picked = available.slice(0, 2);
    for (const j of picked) {
      assignments[j].push({ teamId: team.id, teamName: team.name });
      swCounts[j]++;
    }
    swAssigned.push({ teamId: team.id, teamName: team.name, judges: picked });
  }

  // 4. Clear existing assignments and create new ones
  console.log("=== Clearing old assignments ===\n");
  await prisma.judgeAssignment.deleteMany({});

  console.log("=== Creating Judge Assignments ===\n");

  let totalCreated = 0;
  for (const [judgeName, teams] of Object.entries(assignments)) {
    const judgeId = judgeUsers[judgeName];
    console.log(`${judgeName}: ${teams.length} teams`);

    for (let i = 0; i < teams.length; i++) {
      const slotStart = new Date(EVENT_DATE.getTime() + i * SLOT_DURATION_MIN * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MIN * 60 * 1000);

      await prisma.judgeAssignment.create({
        data: {
          judgeId,
          teamId: teams[i].teamId,
          timeSlotStart: slotStart,
          timeSlotEnd: slotEnd,
          status: "SCHEDULED",
        },
      });
      totalCreated++;
    }

    // Print the judge's schedule
    for (let i = 0; i < teams.length; i++) {
      const estMinutes = i * SLOT_DURATION_MIN;
      console.log(`  ${String(i + 1).padStart(2)}. ${teams[i].teamName.padEnd(40)} ~${estMinutes} min from start`);
    }
    console.log();
  }

  console.log(`=== Total assignments created: ${totalCreated} ===\n`);

  // 5. Print summary
  console.log("=== Summary ===\n");
  console.log(`  Harish (HW):  ${assignments.Harish.length}/25  (reserved: Scuffed Engineering, Tesla Core)`);
  console.log(`  Swaroop (SW): ${assignments.Swaroop.length}/25  (reserved: Scuffed Engineering, Mavericks)`);
  console.log(`  Neeraj (SW):  ${assignments.Neeraj.length}/25  (reserved: Tesla Core)`);
  console.log(`  Santosh (SW): ${assignments.Santosh.length}/25  (reserved: Mavericks)`);
  console.log(`  Total now: ${totalCreated} | After 3 teams register: 100`);

  // 6. Print judge credentials
  console.log("\n=== Judge Credentials ===\n");
  for (const judge of JUDGES) {
    console.log(`  ${judge.name.padEnd(10)} | ${judge.email.padEnd(28)} | ${DEFAULT_PASSWORD}`);
  }

  // 7. Print reserved slots
  console.log("\n=== Reserved Slots (add when teams register) ===\n");
  for (const [team, info] of Object.entries(RESERVED)) {
    console.log(`  ${team} (${info.category}) → ${info.judges.join(" + ")}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
