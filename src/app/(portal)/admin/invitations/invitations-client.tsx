"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Search,
  FilterX,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CandidateTeam } from "./page";

const ALL = "__all__";

function useUniqueValues(teams: CandidateTeam[], key: keyof CandidateTeam) {
  return useMemo(() => {
    const vals = new Set<string>();
    for (const t of teams) {
      const v = String(t[key] ?? "").trim();
      if (v) vals.add(v);
    }
    return Array.from(vals).sort();
  }, [teams, key]);
}

interface Filters {
  status: string;
  mailSent: string;
  gender: string;
  location: string;
  userType: string;
  domain: string;
  course: string;
  specialization: string;
  candidateRole: string;
}

const defaultFilters: Filters = {
  status: ALL,
  mailSent: ALL,
  gender: ALL,
  location: ALL,
  userType: ALL,
  domain: ALL,
  course: ALL,
  specialization: ALL,
  candidateRole: ALL,
};

export function InvitationsClient({ teams }: { teams: CandidateTeam[] }) {
  const [teamData, setTeamData] = useState(teams);
  const [selectedTeam, setSelectedTeam] = useState<CandidateTeam | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingSelected, setSendingSelected] = useState(false);
  const [sendingOne, setSendingOne] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Compute unique values for each filterable field
  const statuses = useUniqueValues(teamData, "status");
  const genders = useUniqueValues(teamData, "candidateGender");
  const locations = useUniqueValues(teamData, "candidateLocation");
  const userTypes = useUniqueValues(teamData, "userType");
  const domains = useUniqueValues(teamData, "domain");
  const courses = useUniqueValues(teamData, "course");
  const specializations = useUniqueValues(teamData, "specialization");
  const roles = useUniqueValues(teamData, "candidateRole");

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== ALL
  ).length;

  function setFilter<K extends keyof Filters>(key: K, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setSearchQuery("");
  }

  const filteredTeams = useMemo(() => {
    return teamData.filter((t) => {
      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !t.teamName.toLowerCase().includes(q) &&
          !t.candidateName.toLowerCase().includes(q) &&
          !t.candidateEmail.toLowerCase().includes(q)
        )
          return false;
      }
      // Filters
      if (filters.status !== ALL && t.status !== filters.status) return false;
      if (filters.mailSent !== ALL) {
        if (filters.mailSent === "sent" && !t.mailSent) return false;
        if (filters.mailSent === "not_sent" && t.mailSent) return false;
      }
      if (
        filters.gender !== ALL &&
        t.candidateGender !== filters.gender
      )
        return false;
      if (
        filters.location !== ALL &&
        t.candidateLocation !== filters.location
      )
        return false;
      if (filters.userType !== ALL && t.userType !== filters.userType)
        return false;
      if (filters.domain !== ALL && t.domain !== filters.domain) return false;
      if (filters.course !== ALL && t.course !== filters.course) return false;
      if (
        filters.specialization !== ALL &&
        t.specialization !== filters.specialization
      )
        return false;
      if (
        filters.candidateRole !== ALL &&
        t.candidateRole !== filters.candidateRole
      )
        return false;
      return true;
    });
  }, [teamData, searchQuery, filters]);

  const totalSent = teamData.filter((t) => t.mailSent).length;
  const totalPending = teamData.filter((t) => !t.mailSent).length;

  const checkedUnsent = filteredTeams.filter(
    (t) => checked.has(t.teamId) && !t.mailSent
  );

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
      setChecked((prev) => {
        const next = new Set(prev);
        for (const t of filteredUnsent) next.delete(t.teamId);
        return next;
      });
    } else {
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
    setEditingTeamName(false);
    setDialogOpen(true);
  }

  function saveTeamName() {
    const trimmed = editedName.trim();
    if (!trimmed || !selectedTeam) {
      setEditingTeamName(false);
      return;
    }
    setTeamData((prev) =>
      prev.map((t) =>
        t.teamId === selectedTeam.teamId ? { ...t, teamName: trimmed } : t
      )
    );
    setSelectedTeam({ ...selectedTeam, teamName: trimmed });
    setEditingTeamName(false);
    toast.success("Team name updated");
  }

  return (
    <div className="space-y-4">
      {/* Stats and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Badge variant="secondary" className="text-xs">
            {teamData.length} Total
          </Badge>
          <Badge className="border-green-800 bg-green-900/30 text-xs text-green-400">
            {totalSent} Sent
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {totalPending} Pending
          </Badge>
          {(activeFilterCount > 0 || searchQuery) && (
            <Badge variant="outline" className="text-xs">
              {filteredTeams.length} shown
            </Badge>
          )}
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
          placeholder="Search by team, leader name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Status"
          value={filters.status}
          options={statuses}
          onChange={(v) => setFilter("status", v)}
        />
        <FilterDropdown
          label="Mail"
          value={filters.mailSent}
          options={[
            { value: "sent", label: "Sent" },
            { value: "not_sent", label: "Not Sent" },
          ]}
          onChange={(v) => setFilter("mailSent", v)}
        />
        <FilterDropdown
          label="Gender"
          value={filters.gender}
          options={genders.map((g) => ({
            value: g,
            label: g === "M" ? "Male" : g === "F" ? "Female" : g,
          }))}
          onChange={(v) => setFilter("gender", v)}
        />
        <FilterDropdown
          label="Location"
          value={filters.location}
          options={locations}
          onChange={(v) => setFilter("location", v)}
        />
        <FilterDropdown
          label="User Type"
          value={filters.userType}
          options={userTypes}
          onChange={(v) => setFilter("userType", v)}
        />
        {domains.length > 0 && (
          <FilterDropdown
            label="Domain"
            value={filters.domain}
            options={domains}
            onChange={(v) => setFilter("domain", v)}
          />
        )}
        {courses.length > 0 && (
          <FilterDropdown
            label="Course"
            value={filters.course}
            options={courses}
            onChange={(v) => setFilter("course", v)}
          />
        )}
        {specializations.length > 0 && (
          <FilterDropdown
            label="Specialization"
            value={filters.specialization}
            options={specializations}
            onChange={(v) => setFilter("specialization", v)}
          />
        )}
        {roles.length > 1 && (
          <FilterDropdown
            label="Role"
            value={filters.candidateRole}
            options={roles}
            onChange={(v) => setFilter("candidateRole", v)}
          />
        )}
        {(activeFilterCount > 0 || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 gap-1 text-xs text-muted-foreground"
          >
            <FilterX className="size-3.5" />
            Clear{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        )}
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
                  className="size-4 cursor-pointer rounded border-border accent-primary"
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
            {filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No teams match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
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
                        className="size-4 cursor-pointer rounded border-border accent-primary"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {team.rank}
                  </TableCell>
                  <TableCell className="font-medium">{team.teamName}</TableCell>
                  <TableCell>{team.candidateName}</TableCell>
                  <TableCell>
                    {team.status === "Selected" ? (
                      <Badge className="border-green-800 bg-green-900/30 text-green-400">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editingTeamName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTeamName();
                          if (e.key === "Escape") setEditingTeamName(false);
                        }}
                        autoFocus
                        className="flex-1 rounded border bg-background px-2 py-1 text-base outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={saveTeamName}
                      >
                        <Check className="size-4 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setEditingTeamName(false)}
                      >
                        <X className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {selectedTeam.teamName}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => {
                          setEditedName(selectedTeam.teamName);
                          setEditingTeamName(true);
                        }}
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Rank #{selectedTeam.rank} &middot; Team ID:{" "}
                  {selectedTeam.teamId}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <DetailRow
                  label="Team Leader"
                  value={selectedTeam.candidateName}
                />
                <DetailRow label="Email" value={selectedTeam.candidateEmail} />
                <DetailRow
                  label="Mobile"
                  value={selectedTeam.candidateMobile}
                />
                <DetailRow
                  label="Gender"
                  value={
                    selectedTeam.candidateGender === "M"
                      ? "Male"
                      : selectedTeam.candidateGender === "F"
                        ? "Female"
                        : selectedTeam.candidateGender
                  }
                />
                <DetailRow
                  label="Location"
                  value={selectedTeam.candidateLocation}
                />
                <DetailRow
                  label="Selection Status"
                  value={selectedTeam.status}
                />
                <DetailRow
                  label="Role"
                  value={selectedTeam.candidateRole}
                />
                <DetailRow label="User Type" value={selectedTeam.userType} />
                {selectedTeam.domain && (
                  <DetailRow label="Domain" value={selectedTeam.domain} />
                )}
                {selectedTeam.course && (
                  <DetailRow label="Course" value={selectedTeam.course} />
                )}
                {selectedTeam.specialization && (
                  <DetailRow
                    label="Specialization"
                    value={selectedTeam.specialization}
                  />
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

/* ── Filter dropdown ─────────────────────────────────────── */

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const normalized =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ value: o, label: o }))
      : (options as { value: string; label: string }[]);

  const isActive = value !== ALL;

  return (
    <Select value={value} onValueChange={(v) => { if (v !== null) onChange(v); }}>
      <SelectTrigger
        size="sm"
        className={isActive ? "border-primary/50 bg-primary/5" : ""}
      >
        <SelectValue placeholder={label}>
          {isActive
            ? normalized.find((o) => o.value === value)?.label ?? label
            : label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label}</SelectItem>
        {normalized.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Detail row ──────────────────────────────────────────── */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
