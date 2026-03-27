"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Button } from "@/components/ui/button";
import { Trophy, Check, Heart } from "lucide-react";

interface MeData {
  userId: string;
  teamId: string | null;
  teamName: string | null;
}

export default function VotingPage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/participant/me")
      .then((res) => res.json())
      .then((data: MeData) => setMe(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finalRound = useQuery(api.finalRound.getActive);

  if (loading || finalRound === undefined) {
    return <FullScreenLoading />;
  }

  if (!finalRound) {
    return <WaitingScreen message="Final round is brewing..." />;
  }

  if (finalRound.status === "setup" && finalRound.currentTeamIndex === -1) {
    return <WaitingScreen message="Get ready! The final round is about to begin..." />;
  }

  if (finalRound.status === "finished") {
    return <LeaderboardScreen finalRoundId={finalRound._id} />;
  }

  if (finalRound.status === "active" && finalRound.currentTeamIndex >= 0) {
    const currentTeam = finalRound.teams[finalRound.currentTeamIndex];
    if (!currentTeam) return <WaitingScreen message="Stay tuned..." />;

    return (
      <VotingScreen
        finalRoundId={finalRound._id}
        currentTeam={currentTeam}
        visitorId={me?.userId ?? ""}
        visitorTeamId={me?.teamId ?? ""}
        isOwnTeam={me?.teamId === currentTeam.teamId}
      />
    );
  }

  return <WaitingScreen message="Stay tuned..." />;
}

// ── Full Screen Loading ──

function FullScreenLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// ── Waiting Screen ──

function WaitingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-primary/10">
          <Trophy className="size-8 text-primary" />
        </div>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          The screen will update automatically
        </p>
      </div>
    </div>
  );
}

// ── Voting Screen ──

function VotingScreen({
  finalRoundId,
  currentTeam,
  visitorId,
  visitorTeamId,
  isOwnTeam,
}: {
  finalRoundId: string;
  currentTeam: { teamId: string; teamName: string };
  visitorId: string;
  visitorTeamId: string;
  isOwnTeam: boolean;
}) {
  const [voting, setVoting] = useState(false);

  const voteCount = useQuery(api.finalRound.getVoteCount, {
    finalRoundId: finalRoundId as never,
    teamId: currentTeam.teamId,
  });

  const hasVoted = useQuery(
    api.finalRound.hasVoted,
    visitorId
      ? {
          finalRoundId: finalRoundId as never,
          visitorId,
          teamId: currentTeam.teamId,
        }
      : "skip"
  );

  const castVote = useMutation(api.finalRound.castVote);

  const handleVote = async () => {
    if (voting || hasVoted || isOwnTeam || !visitorId) return;
    setVoting(true);
    try {
      await castVote({
        finalRoundId: finalRoundId as never,
        teamId: currentTeam.teamId,
        visitorId,
        visitorTeamId,
      });
    } catch {
      // already voted or other error
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Team Name */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Now Presenting
          </p>
          <h1 className="font-mono text-3xl font-bold text-foreground sm:text-4xl">
            {currentTeam.teamName}
          </h1>
        </div>

        {/* Vote Count */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-6xl font-bold text-primary sm:text-7xl">
            <NumberTicker value={voteCount ?? 0} />
          </span>
          <span className="text-sm text-muted-foreground">votes</span>
        </div>

        {/* Vote Button */}
        {isOwnTeam ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              This is your team
            </p>
          </div>
        ) : hasVoted ? (
          <Button
            disabled
            size="lg"
            className="w-full gap-2 bg-green-600 text-white hover:bg-green-600"
          >
            <Check className="size-5" />
            Voted
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleVote}
            disabled={voting || !visitorId}
          >
            <Heart className="size-5" />
            {voting ? "Voting..." : "Vote"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard Screen ──

function LeaderboardScreen({ finalRoundId }: { finalRoundId: string }) {
  const voteCounts = useQuery(api.finalRound.getAllVoteCounts, {
    finalRoundId: finalRoundId as never,
  });

  if (!voteCounts) return <FullScreenLoading />;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Trophy className="mx-auto size-10 text-yellow-500" />
          <h1 className="mt-2 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            Results
          </h1>
        </div>

        <div className="space-y-3">
          {voteCounts.map((team, index) => (
            <div
              key={team.teamId}
              className={`flex items-center gap-4 rounded-xl border p-4 ${
                index === 0
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : "border-border"
              }`}
            >
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
                <p className="font-medium text-foreground">{team.teamName}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-primary">
                  <NumberTicker value={team.votes} />
                </span>
                <p className="text-xs text-muted-foreground">votes</p>
              </div>
              {index === 0 && <Trophy className="size-5 text-yellow-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
