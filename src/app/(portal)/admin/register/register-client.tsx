"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2, UserPlus, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface UnregisteredTeam {
  teamName: string;
  category: string;
  leadName: string;
  leadPhone: string;
  suggestedEmail: string;
  alreadyRegistered: boolean;
}

interface RegisteredResult {
  teamName: string;
  email: string;
  password: string;
}

export function RegisterClient({ teams }: { teams: UnregisteredTeam[] }) {
  const [formState, setFormState] = useState<
    Record<string, { email: string; password: string }>
  >(
    Object.fromEntries(
      teams.map((t) => [
        t.teamName,
        { email: t.suggestedEmail, password: "" },
      ])
    )
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Record<string, RegisteredResult>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  async function handleRegister(team: UnregisteredTeam) {
    const form = formState[team.teamName];
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(team.teamName);
    try {
      const res = await fetch("/api/admin/teams/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          category: team.category,
          leadName: team.leadName,
          leadEmail: form.email,
          leadPhone: team.leadPhone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      setRegistered((prev) => ({
        ...prev,
        [team.teamName]: {
          teamName: team.teamName,
          email: form.email,
          password: form.password,
        },
      }));
      toast.success(`${team.teamName} registered successfully`);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  }

  function copyCredentials(teamName: string) {
    const cred = registered[teamName];
    if (!cred) return;
    navigator.clipboard.writeText(
      `Team: ${cred.teamName}\nEmail: ${cred.email}\nPassword: ${cred.password}`
    );
    toast.success("Credentials copied to clipboard");
  }

  return (
    <div className="grid gap-4">
      {teams.map((team) => {
        const isRegistered =
          team.alreadyRegistered || !!registered[team.teamName];
        const isLoading = loading === team.teamName;
        const result = registered[team.teamName];

        return (
          <Card
            key={team.teamName}
            className={isRegistered ? "border-green-500/30 bg-green-500/5" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {team.teamName}
                    {isRegistered && (
                      <CheckCircle className="size-5 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Lead: {team.leadName}
                    {team.leadPhone && ` | ${team.leadPhone}`}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    team.category === "Hardware" ? "destructive" : "default"
                  }
                >
                  {team.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {team.alreadyRegistered ? (
                <p className="text-sm text-green-600">
                  Already registered in the system.
                </p>
              ) : result ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600 font-medium">
                    Registered! Share these credentials with the team:
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-sm">
                    <div className="flex-1">
                      <div>
                        Email: <span className="font-bold">{result.email}</span>
                      </div>
                      <div>
                        Password:{" "}
                        <span className="font-bold">{result.password}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyCredentials(team.teamName)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="lead@email.com"
                      value={formState[team.teamName]?.email || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          [team.teamName]: {
                            ...prev[team.teamName],
                            email: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword[team.teamName] ? "text" : "password"}
                        placeholder="Min 8 characters"
                        value={formState[team.teamName]?.password || ""}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            [team.teamName]: {
                              ...prev[team.teamName],
                              password: e.target.value,
                            },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            [team.teamName]: !prev[team.teamName],
                          }))
                        }
                      >
                        {showPassword[team.teamName] ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRegister(team)}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 size-4" />
                    )}
                    Register
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
