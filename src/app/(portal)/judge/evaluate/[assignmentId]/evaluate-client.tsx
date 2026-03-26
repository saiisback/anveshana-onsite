"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Users,
  Tag,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const COMPLETED_STATUS = "COMPLETED";

const evaluationSchema = z.object({
  score: z
    .number({ error: "Score is required" })
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100"),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface EvaluateClientProps {
  assignmentId: string;
  status: string;
  existingScore: number | null;
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
  timeSlotStart,
  timeSlotEnd,
  team,
}: EvaluateClientProps) {
  const [submitted, setSubmitted] = useState(status === COMPLETED_STATUS);
  const [finalScore, setFinalScore] = useState(existingScore);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
  });

  async function onSubmit(data: EvaluationFormData) {
    try {
      const res = await fetch("/api/admin/judges/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          score: data.score,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit evaluation");
      }

      setSubmitted(true);
      setFinalScore(data.score);
      toast.success("Evaluation submitted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit evaluation"
      );
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
          {team.prototypeTitle && (
            <CardDescription className="text-sm font-medium text-foreground">
              {team.prototypeTitle}
            </CardDescription>
          )}
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
            <p className="text-sm text-muted-foreground">
              Score: {finalScore}/100
            </p>
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
              Rate this team&apos;s prototype on a scale of 0 to 100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="score">Score (0–100)</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Enter score"
                  {...register("score", { valueAsNumber: true })}
                />
                {errors.score && (
                  <p className="text-sm text-destructive">
                    {errors.score.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1.5 size-4" />
                )}
                Submit Evaluation
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
