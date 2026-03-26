"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Users,
  Tag,
  MapPin,
  Clock,
  Lightbulb,
  Wrench,
  TrendingUp,
  Layers,
  Sparkles,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const COMPLETED_STATUS = "COMPLETED";

const CRITERIA = [
  { key: "innovation", label: "Innovation", description: "How novel is the idea?", icon: Lightbulb, color: "text-yellow-500" },
  { key: "execution", label: "Execution", description: "How well is the prototype built?", icon: Wrench, color: "text-blue-500" },
  { key: "marketFit", label: "Market Fit", description: "Does it solve a real problem?", icon: TrendingUp, color: "text-green-500" },
  { key: "scalability", label: "Scalability", description: "Can it grow beyond the demo?", icon: Layers, color: "text-purple-500" },
  { key: "uniqueness", label: "Uniqueness", description: "How differentiated from existing solutions?", icon: Sparkles, color: "text-orange-500" },
  { key: "presentation", label: "Presentation", description: "Quality of demo and communication", icon: Presentation, color: "text-pink-500" },
] as const;

type CriteriaKey = (typeof CRITERIA)[number]["key"];
type Scores = Record<CriteriaKey, number>;

interface ScoreBreakdown {
  innovation: number;
  execution: number;
  marketFit: number;
  scalability: number;
  uniqueness: number;
  presentation: number;
}

interface EvaluateClientProps {
  assignmentId: string;
  status: string;
  existingScore: number | null;
  existingBreakdown: ScoreBreakdown | null;
  timeSlotStart: string;
  timeSlotEnd: string;
  team: {
    name: string;
    prototypeTitle: string | null;
    description: string | null;
    category: string | null;
    stallNumber: number | null;
    members: string[];
  };
}

export function EvaluateClient({
  assignmentId,
  status,
  existingScore,
  existingBreakdown,
  timeSlotStart,
  timeSlotEnd,
  team,
}: EvaluateClientProps) {
  const [submitted, setSubmitted] = useState(status === COMPLETED_STATUS);
  const [finalScore, setFinalScore] = useState(existingScore);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [scores, setScores] = useState<Scores>(
    existingBreakdown ?? {
      innovation: 5,
      execution: 5,
      marketFit: 5,
      scalability: 5,
      uniqueness: 5,
      presentation: 5,
    }
  );

  const rawTotal = Object.values(scores).reduce((a, b) => a + b, 0);
  const scaledScore = Math.round((rawTotal / 60) * 100 * 100) / 100;

  function updateScore(key: CriteriaKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/judges/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, scores }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit evaluation");
      }

      setSubmitted(true);
      setFinalScore(scaledScore);
      toast.success("Evaluation submitted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit evaluation"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/judge/schedule"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to schedule
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{team.name}</CardTitle>
            {team.category && (
              <Badge variant="outline" className="capitalize">
                <Tag className="mr-1 size-3" />
                {team.category}
              </Badge>
            )}
          </div>
          {team.description && (
            <CardDescription>{team.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {team.stallNumber != null && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                Stall #{team.stallNumber}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {new Date(timeSlotStart).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" – "}
              {new Date(timeSlotEnd).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {team.members.length} members
            </span>
          </div>

          {team.members.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Team Members
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {submitted ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="mb-3 size-12 text-green-500" />
            <p className="text-lg font-medium text-foreground">
              Evaluation Submitted
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {finalScore}<span className="text-base font-normal text-muted-foreground">/100</span>
            </p>
            {existingBreakdown && (
              <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-2 text-left text-sm">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between rounded-md bg-background/50 px-3 py-1.5">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-mono font-medium">{existingBreakdown[c.key]}/10</span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/judge/schedule"
              className="mt-4 text-sm text-primary hover:underline"
            >
              Back to schedule
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit Evaluation</CardTitle>
            <CardDescription>
              Rate each parameter from 0 to 10
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {CRITERIA.map((criterion) => {
              const Icon = criterion.icon;
              const value = scores[criterion.key];
              return (
                <div key={criterion.key} className="flex items-center gap-3">
                  <Icon className={`size-5 shrink-0 ${criterion.color}`} />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{criterion.label}</span>
                    <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={value}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= 0 && v <= 10) updateScore(criterion.key, v);
                        if (e.target.value === "") updateScore(criterion.key, 0);
                      }}
                      className="h-9 w-16 text-center font-mono text-lg font-bold"
                    />
                    <span className="text-xs text-muted-foreground">/10</span>
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Score</p>
              <p className="text-3xl font-bold text-foreground">
                {scaledScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
              </p>
              <p className="text-xs text-muted-foreground">
                ({rawTotal}/60 scaled)
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1.5 size-4" />
              )}
              Submit Evaluation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
