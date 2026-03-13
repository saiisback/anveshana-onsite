"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TARGET_ROLES = ["ALL", "PARTICIPANT", "VOLUNTEER", "JUDGE"] as const;
type TargetRole = (typeof TARGET_ROLES)[number];

export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState<TargetRole>("ALL");
  const [isSending, setIsSending] = useState(false);

  const announcements = useQuery(api.announcements.list, {});
  const createAnnouncement = useMutation(api.announcements.create);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setIsSending(true);
    try {
      const trimmedTitle = title.trim();
      const trimmedMessage = message.trim();

      // Create in-app announcement via Convex
      await createAnnouncement({
        title: trimmedTitle,
        message: trimmedMessage,
        targetRole,
        createdBy: userId,
      });

      // Send email notifications (fire-and-forget, don't block UI)
      fetch("/api/email/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          message: trimmedMessage,
          targetRole,
        }),
      }).catch(() => {
        // Email failure shouldn't affect the announcement
        console.error("Failed to send announcement emails");
      });

      setTitle("");
      setMessage("");
      setTargetRole("ALL");
      toast.success("Announcement sent successfully");
    } catch {
      toast.error("Failed to send announcement");
    } finally {
      setIsSending(false);
    }
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "ALL":
        return "default" as const;
      case "PARTICIPANT":
        return "secondary" as const;
      case "VOLUNTEER":
        return "outline" as const;
      case "JUDGE":
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Send announcements to participants, volunteers, and judges
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Announcement</CardTitle>
          <CardDescription>
            Compose a new announcement for event participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your announcement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Audience</Label>
              <select
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role === "ALL" ? "All Roles" : role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" disabled={isSending} className="w-full">
              {isSending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-4" />
              )}
              Send Announcement
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sent Announcements</h2>

        {announcements === undefined ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20" />
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                No announcements yet
              </p>
              <p className="text-sm text-muted-foreground/70">
                Send your first announcement using the form above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <Card key={announcement._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {announcement.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {announcement.message}
                      </CardDescription>
                    </div>
                    <Badge variant={roleBadgeVariant(announcement.targetRole)}>
                      {announcement.targetRole === "ALL"
                        ? "All"
                        : announcement.targetRole.charAt(0) +
                          announcement.targetRole.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Sent{" "}
                    {new Date(announcement._creationTime).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
