"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  Trophy,
  ChevronRight,
  BarChart3,
  Plus,
  X,
  GripVertical,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  stallNumber: number | null;
}

interface FinalRoundClientProps {
  teams: Team[];
}

export function FinalRoundClient({ teams }: FinalRoundClientProps) {
  const finalRound = useQuery(api.finalRound.getActive);
  const createFinalRound = useMutation(api.finalRound.create);
  const revealNextTeam = useMutation(api.finalRound.revealNextTeam);
  const showLeaderboard = useMutation(api.finalRound.showLeaderboard);
  const resetFinalRound = useMutation(api.finalRound.reset);

  if (finalRound === undefined) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!finalRound) {
    return <SetupPhase teams={teams} onCreate={createFinalRound} />;
  }

  if (finalRound.status === "setup" || finalRound.status === "active") {
    return (
      <LiveControlPhase
        finalRound={finalRound}
        onRevealNext={() => revealNextTeam({ finalRoundId: finalRound._id })}
        onShowLeaderboard={() => showLeaderboard({ finalRoundId: finalRound._id })}
      />
    );
  }

  return <LeaderboardPhase finalRoundId={finalRound._id} onReset={resetFinalRound} />;
}

// ── Setup Phase ──

function SetupPhase({
  teams,
  onCreate,
}: {
  teams: Team[];
  onCreate: (args: {
    teams: { teamId: string; teamName: string; revealOrder: number }[];
  }) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<Team[]>([]);

  const toggleTeam = (team: Team) => {
    setSelected((prev) => {
      const exists = prev.find((t) => t.id === team.id);
      if (exists) return prev.filter((t) => t.id !== team.id);
      return [...prev, team];
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === selected.length - 1) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleStart = async () => {
    await onCreate({
      teams: selected.map((t, i) => ({
        teamId: t.id,
        teamName: t.name,
        revealOrder: i,
      })),
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Final Round Setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select finalist teams and set their reveal order.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Finalists</CardTitle>
            <CardDescription>
              Choose teams from the approved list
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.map((team) => {
              const isSelected = selected.some((t) => t.id === team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{team.name}</p>
                    {team.stallNumber && (
                      <p className="text-xs text-muted-foreground">
                        Stall #{team.stallNumber}
                      </p>
                    )}
                  </div>
                  {isSelected ? (
                    <X className="size-4 text-primary" />
                  ) : (
                    <Plus className="size-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Reveal Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Reveal Order ({selected.length} selected)
            </CardTitle>
            <CardDescription>
              Reorder teams — first in list is revealed first
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Select teams from the left to get started
              </p>
            ) : (
              <div className="space-y-2">
                {selected.map((team, index) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 rounded-lg border border-border p-3"
                  >
                    <GripVertical className="size-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <span className="flex-1 text-sm font-medium">
                      {team.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="size-7 p-0"
                      >
                        &uarr;
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === selected.length - 1}
                        className="size-7 p-0"
                      >
                        &darr;
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="mt-4 w-full"
              disabled={selected.length === 0}
              onClick={handleStart}
            >
              <Trophy className="mr-2 size-4" />
              Start Final Round ({selected.length} teams)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Live Control Phase ──

function LiveControlPhase({
  finalRound,
  onRevealNext,
  onShowLeaderboard,
}: {
  finalRound: {
    _id: string;
    status: string;
    currentTeamIndex: number;
    teams: { teamId: string; teamName: string; revealOrder: number }[];
  };
  onRevealNext: () => void;
  onShowLeaderboard: () => void;
}) {
  const currentTeam =
    finalRound.currentTeamIndex >= 0
      ? finalRound.teams[finalRound.currentTeamIndex]
      : null;

  const isLastTeam =
    finalRound.currentTeamIndex >= finalRound.teams.length - 1;

  const voteCount = useQuery(
    api.finalRound.getVoteCount,
    currentTeam
      ? {
          finalRoundId: finalRound._id as never,
          teamId: currentTeam.teamId,
        }
      : "skip"
  );

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Final Round — Live Control
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team {finalRound.currentTeamIndex + 1} of {finalRound.teams.length}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {finalRound.teams.map((team, i) => (
          <div
            key={team.teamId}
            className={`h-2 flex-1 rounded-full ${
              i < finalRound.currentTeamIndex
                ? "bg-primary"
                : i === finalRound.currentTeamIndex
                  ? "bg-primary animate-pulse"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Current Team */}
      <Card className="border-primary/30">
        <CardContent className="py-8 text-center">
          {currentTeam ? (
            <>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Now Showing
              </p>
              <h2 className="mt-2 font-mono text-3xl font-bold text-foreground">
                {currentTeam.teamName}
              </h2>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Votes:</span>
                <span className="font-mono text-4xl font-bold text-primary">
                  <NumberTicker value={voteCount ?? 0} />
                </span>
              </div>
            </>
          ) : (
            <div>
              <p className="text-lg font-medium text-muted-foreground">
                Ready to begin
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click below to reveal the first team
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-3">
        {!isLastTeam ? (
          <Button className="flex-1" size="lg" onClick={onRevealNext}>
            <ChevronRight className="mr-2 size-5" />
            {currentTeam ? "Reveal Next Team" : "Reveal First Team"}
          </Button>
        ) : currentTeam ? (
          <Button
            className="flex-1"
            size="lg"
            variant="default"
            onClick={onShowLeaderboard}
          >
            <BarChart3 className="mr-2 size-5" />
            Show Leaderboard
          </Button>
        ) : null}
      </div>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {finalRound.teams.map((team, i) => (
            <div
              key={team.teamId}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                i === finalRound.currentTeamIndex
                  ? "border-primary bg-primary/10"
                  : i < finalRound.currentTeamIndex
                    ? "border-border opacity-60"
                    : "border-border opacity-40"
              }`}
            >
              <Badge variant="outline" className="font-mono text-xs">
                {i + 1}
              </Badge>
              <span className="text-sm font-medium">{team.teamName}</span>
              {i < finalRound.currentTeamIndex && (
                <Badge className="ml-auto" variant="secondary">
                  Done
                </Badge>
              )}
              {i === finalRound.currentTeamIndex && (
                <Badge className="ml-auto">Live</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Leaderboard Phase ──

function LeaderboardPhase({ finalRoundId, onReset }: { finalRoundId: string; onReset: () => Promise<unknown> }) {
  const voteCounts = useQuery(api.finalRound.getAllVoteCounts, {
    finalRoundId: finalRoundId as never,
  });

  if (!voteCounts) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Final Round — Results
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leaderboard is now visible to all participants
        </p>
      </div>

      <div className="space-y-3">
        {voteCounts.map((team, index) => (
          <Card
            key={team.teamId}
            className={index === 0 ? "border-yellow-500/50 bg-yellow-500/5" : ""}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <span
                className={`font-mono text-2xl font-bold ${
                  index === 0
                    ? "text-yellow-500"
                    : index === 1
                      ? "text-slate-400"
                      : index === 2
                        ? "text-amber-700"
                        : "text-muted-foreground"
                }`}
              >
                #{index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium">{team.teamName}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-primary">
                  <NumberTicker value={team.votes} />
                </span>
                <p className="text-xs text-muted-foreground">votes</p>
              </div>
              {index === 0 && <Trophy className="size-6 text-yellow-500" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          if (confirm("Reset the final round? This deletes all votes and data.")) {
            onReset();
          }
        }}
      >
        Reset Final Round
      </Button>
    </div>
  );
}
