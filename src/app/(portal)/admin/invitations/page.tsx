import { readFileSync } from "fs";
import { join } from "path";
import prisma from "@/lib/prisma";
import { InvitationsClient } from "./invitations-client";

export interface CandidateTeam {
  rank: string;
  teamName: string;
  status: string;
  teamId: string;
  candidateRole: string;
  candidateName: string;
  candidateEmail: string;
  candidateMobile: string;
  candidateGender: string;
  candidateLocation: string;
  userType: string;
  domain: string;
  course: string;
  specialization: string;
  mailSent: boolean;
}

function parseCSV(csvText: string): CandidateTeam[] {
  const lines = csvText.trim().split("\n");
  const teams: CandidateTeam[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Parse CSV respecting quoted fields
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of row) {
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

    if (fields.length >= 14) {
      teams.push({
        rank: fields[0],
        teamName: fields[1],
        status: fields[2],
        teamId: fields[3],
        candidateRole: fields[4],
        candidateName: fields[5],
        candidateEmail: fields[6],
        candidateMobile: fields[7],
        candidateGender: fields[8],
        candidateLocation: fields[9],
        userType: fields[10],
        domain: fields[11],
        course: fields[12],
        specialization: fields[13],
        mailSent: false,
      });
    }
  }

  return teams;
}

export default async function AdminInvitationsPage() {
  // Read CSV
  const csvPath = join(process.cwd(), "public", "candidate-details.csv");
  const csvText = readFileSync(csvPath, "utf-8");
  const teams = parseCSV(csvText);

  // Get all sent invitations to cross-reference
  const invitations = await prisma.invitation.findMany({
    select: { email: true },
  });
  const sentEmails = new Set(invitations.map((inv) => inv.email.toLowerCase()));

  // Mark mail sent status
  const teamsWithMailStatus = teams.map((team) => ({
    ...team,
    mailSent: sentEmails.has(team.candidateEmail.toLowerCase()),
  }));

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Invitations
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage team invitations for Anveshana 2026
        </p>
      </div>
      <InvitationsClient teams={teamsWithMailStatus} />
    </div>
  );
}
