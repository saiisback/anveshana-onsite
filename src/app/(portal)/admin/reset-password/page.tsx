"use client";

import { useEffect, useState } from "react";
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
import { Loader2, CheckCircle2, KeyRound, UserPlus } from "lucide-react";

interface Team {
  id: string;
  name: string;
  stallNumber: number | null;
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

export default function ResetPasswordPage() {
  // Reset password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Add member state
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/teams/list")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(() => {});
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to send reset link");

      setResetSuccess(
        `Password reset link sent to ${resetEmail}${data.userName ? ` (${data.userName})` : ""}`
      );
      setResetEmail("");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setResetLoading(false);
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
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8 px-4">
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
                Send a password reset link to a user&apos;s email
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">User Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="user@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <StatusMessage error={resetError} success={resetSuccess} />

            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
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
