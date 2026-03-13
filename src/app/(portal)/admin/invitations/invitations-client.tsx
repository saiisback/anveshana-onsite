"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Send, CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import type { CandidateTeam } from "./page";

export function InvitationsClient({ teams }: { teams: CandidateTeam[] }) {
  const [teamData, setTeamData] = useState(teams);
  const [selectedTeam, setSelectedTeam] = useState<CandidateTeam | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingSelected, setSendingSelected] = useState(false);
  const [sendingOne, setSendingOne] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const filteredTeams = teamData.filter(
    (t) =>
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSent = teamData.filter((t) => t.mailSent).length;
  const totalPending = teamData.filter((t) => !t.mailSent).length;

  // Only unsent teams in the filtered view that are checked
  const checkedUnsent = filteredTeams.filter(
    (t) => checked.has(t.teamId) && !t.mailSent
  );

  // All unsent in filtered view for select-all logic
  const filteredUnsent = filteredTeams.filter((t) => !t.mailSent);
  const allFilteredUnsentChecked =
    filteredUnsent.length > 0 &&
    filteredUnsent.every((t) => checked.has(t.teamId));

  function toggleOne(teamId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function toggleAll() {
    if (allFilteredUnsentChecked) {
      // Uncheck all filtered unsent
      setChecked((prev) => {
        const next = new Set(prev);
        for (const t of filteredUnsent) next.delete(t.teamId);
        return next;
      });
    } else {
      // Check all filtered unsent
      setChecked((prev) => {
        const next = new Set(prev);
        for (const t of filteredUnsent) next.add(t.teamId);
        return next;
      });
    }
  }

  async function sendInvitation(emails: string[]) {
    const res = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async function handleSendOne(team: CandidateTeam) {
    setSendingOne(team.teamId);
    try {
      await sendInvitation([team.candidateEmail]);
      setTeamData((prev) =>
        prev.map((t) =>
          t.teamId === team.teamId ? { ...t, mailSent: true } : t
        )
      );
      setChecked((prev) => {
        const next = new Set(prev);
        next.delete(team.teamId);
        return next;
      });
      if (selectedTeam?.teamId === team.teamId) {
        setSelectedTeam({ ...team, mailSent: true });
      }
      toast.success(`Invitation sent to ${team.candidateName}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setSendingOne(null);
    }
  }

  async function handleSendSelected() {
    if (checkedUnsent.length === 0) {
      toast.info("No unsent teams selected");
      return;
    }

    setSendingSelected(true);
    try {
      const emails = checkedUnsent.map((t) => t.candidateEmail);
      const sentIds = new Set(checkedUnsent.map((t) => t.teamId));
      await sendInvitation(emails);
      setTeamData((prev) =>
        prev.map((t) =>
          sentIds.has(t.teamId) ? { ...t, mailSent: true } : t
        )
      );
      setChecked((prev) => {
        const next = new Set(prev);
        for (const id of sentIds) next.delete(id);
        return next;
      });
      toast.success(`Invitations sent to ${checkedUnsent.length} teams`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setSendingSelected(false);
    }
  }

  function openDetails(team: CandidateTeam) {
    setSelectedTeam(team);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Stats and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Badge variant="secondary" className="text-xs">
            {teamData.length} Teams
          </Badge>
          <Badge className="bg-green-900/30 text-green-400 border-green-800 text-xs">
            {totalSent} Sent
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {totalPending} Pending
          </Badge>
        </div>
        <Button
          onClick={handleSendSelected}
          disabled={sendingSelected || checkedUnsent.length === 0}
        >
          {sendingSelected ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 size-4" />
          )}
          Send Selected ({checkedUnsent.length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by team or leader name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Teams table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allFilteredUnsentChecked}
                  onChange={toggleAll}
                  disabled={filteredUnsent.length === 0}
                  className="size-4 rounded border-border accent-primary cursor-pointer"
                />
              </TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead>Selection</TableHead>
              <TableHead>Mail Sent</TableHead>
              <TableHead className="w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow
                key={team.teamId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openDetails(team)}
              >
                <TableCell>
                  {team.mailSent ? (
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="size-4 rounded border-border accent-primary opacity-40"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={checked.has(team.teamId)}
                      onChange={() => toggleOne(team.teamId)}
                      onClick={(e) => e.stopPropagation()}
                      className="size-4 rounded border-border accent-primary cursor-pointer"
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {team.rank}
                </TableCell>
                <TableCell className="font-medium">{team.teamName}</TableCell>
                <TableCell>{team.candidateName}</TableCell>
                <TableCell>
                  {team.status === "Selected" ? (
                    <Badge className="bg-green-900/30 text-green-400 border-green-800">
                      Selected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{team.status}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {team.mailSent ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={team.mailSent ? "ghost" : "default"}
                    disabled={team.mailSent || sendingOne === team.teamId}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendOne(team);
                    }}
                  >
                    {sendingOne === team.teamId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : team.mailSent ? (
                      "Sent"
                    ) : (
                      "Send"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTeam.teamName}</DialogTitle>
                <DialogDescription>
                  Rank #{selectedTeam.rank} &middot; Team ID: {selectedTeam.teamId}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <DetailRow label="Team Leader" value={selectedTeam.candidateName} />
                <DetailRow label="Email" value={selectedTeam.candidateEmail} />
                <DetailRow label="Mobile" value={selectedTeam.candidateMobile} />
                <DetailRow label="Gender" value={selectedTeam.candidateGender === "M" ? "Male" : "Female"} />
                <DetailRow label="Location" value={selectedTeam.candidateLocation} />
                <DetailRow label="Selection Status" value={selectedTeam.status} />
                <DetailRow label="User Type" value={selectedTeam.userType} />
                {selectedTeam.domain && (
                  <DetailRow label="Domain" value={selectedTeam.domain} />
                )}
                {selectedTeam.course && (
                  <DetailRow label="Course" value={selectedTeam.course} />
                )}
                {selectedTeam.specialization && (
                  <DetailRow label="Specialization" value={selectedTeam.specialization} />
                )}
                <DetailRow
                  label="Invitation"
                  value={selectedTeam.mailSent ? "Sent" : "Not sent"}
                />
              </div>
              <DialogFooter showCloseButton>
                {!selectedTeam.mailSent && (
                  <Button
                    onClick={() => handleSendOne(selectedTeam)}
                    disabled={sendingOne === selectedTeam.teamId}
                  >
                    {sendingOne === selectedTeam.teamId ? (
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 size-4" />
                    )}
                    Send Invitation
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
