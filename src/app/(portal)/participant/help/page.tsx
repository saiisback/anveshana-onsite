"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CLAIMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const URGENCY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type Category = "Technical" | "Logistics" | "Judge" | "Other";
type Urgency = "Low" | "Medium" | "High";

export default function ParticipantHelpPage() {
  // TODO: Replace with actual session data
  const teamId = "placeholder-team-id";
  const teamName = "Placeholder Team";

  const requests = useQuery(api.helpRequests.listByTeam, { teamId });
  const createRequest = useMutation(api.helpRequests.create);

  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        teamId,
        teamName,
        category: category as Category,
        description: description || undefined,
        urgency,
      });
      setCategory("");
      setDescription("");
      setUrgency("Medium");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Request Help</h1>
        <p className="text-muted-foreground">
          Need assistance? Submit a request and a volunteer will come to your stall.
        </p>
      </div>

      {/* Create Help Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Help Request</CardTitle>
          <CardDescription>
            Describe what you need help with and we will send a volunteer your way.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as Category)}
              >
                <SelectTrigger className="w-full" id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Judge">Judge</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need help with..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Urgency */}
            <fieldset className="space-y-2">
              <Label>Urgency</Label>
              <div className="flex gap-4">
                {(["Low", "Medium", "High"] as const).map((level) => (
                  <label
                    key={level}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level}
                      checked={urgency === level}
                      onChange={() => setUrgency(level)}
                      className="accent-primary"
                    />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLORS[level]}`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Button type="submit" disabled={!category || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Team's Help Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Requests</h2>

        {requests === undefined && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        {requests?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No help requests yet. Submit one above if you need assistance.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {requests?.map((req) => (
            <Card key={req._id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={STATUS_COLORS[req.status]}
                  >
                    {req.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="secondary" className={URGENCY_COLORS[req.urgency]}>
                    {req.urgency}
                  </Badge>
                  <Badge variant="outline">{req.category}</Badge>
                </div>

                {req.description && (
                  <p className="text-sm text-foreground">{req.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {req.volunteerName && (
                    <span>Volunteer: {req.volunteerName}</span>
                  )}
                  <span>Created: {new Date(req._creationTime).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
