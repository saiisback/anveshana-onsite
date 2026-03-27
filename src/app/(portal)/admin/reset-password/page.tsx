"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, KeyRound, UserPlus, Search, Send } from "lucide-react";

interface Team {
  id: string;
  name: string;
  stallNumber: number | null;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  teamName: string | null;
}

function StatusMessage({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-800 bg-green-950/50 p-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}
    </>
  );
}

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-900/50 text-purple-400 border-purple-800",
  PARTICIPANT: "bg-blue-900/50 text-blue-400 border-blue-800",
  VOLUNTEER: "bg-amber-900/50 text-amber-400 border-amber-800",
  JUDGE: "bg-green-900/50 text-green-400 border-green-800",
};

export default function ResetPasswordPage() {
  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Add member state
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users/list").then((r) => r.json()),
      fetch("/api/admin/teams/list").then((r) => r.json()),
    ])
      .then(([usersData, teamsData]) => {
        setUsers(usersData);
        setTeams(teamsData);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teamName && u.teamName.toLowerCase().includes(q))
    );
  }, [users, search]);

  async function handleSendReset(user: UserItem) {
    setResetError("");
    setResetSuccess("");
    setSendingFor(user.id);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send reset link");

      setResetSuccess(`Password reset link sent to ${user.name} (${user.email})`);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSendingFor(null);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);

    try {
      const res = await fetch("/api/admin/add-team-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName,
          email: memberEmail,
          teamId: selectedTeamId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to add member");

      setAddSuccess(data.message);
      setMemberName("");
      setMemberEmail("");
      setSelectedTeamId("");

      // Refresh users list
      fetch("/api/admin/users/list")
        .then((r) => r.json())
        .then(setUsers)
        .catch(() => {});
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      {/* Reset Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <KeyRound className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Reset User Password</CardTitle>
              <CardDescription>
                Search for a user and send them a password reset link
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <StatusMessage error={resetError} success={resetSuccess} />

          {/* User list */}
          <div
            ref={listRef}
            className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border border-border"
          >
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No users match your search" : "No users found"}
              </div>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColors[user.role] ?? ""}`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                      {user.teamName && (
                        <span className="text-muted-foreground/60">
                          {" "}
                          &middot; {user.teamName}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sendingFor !== null}
                    onClick={() => handleSendReset(user)}
                    className="shrink-0 gap-1.5"
                  >
                    {sendingFor === user.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    Send
                  </Button>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        </CardContent>
      </Card>

      {/* Add Member to Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle>Add Member to Team</CardTitle>
              <CardDescription>
                Add a new user to a team and send them a password setup link
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                type="text"
                placeholder="John Doe"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="user@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? "")} required>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                      {team.stallNumber ? ` (#${team.stallNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <StatusMessage error={addError} success={addSuccess} />

            <Button
              type="submit"
              className="w-full"
              disabled={addLoading || !selectedTeamId}
            >
              {addLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member & Send Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
