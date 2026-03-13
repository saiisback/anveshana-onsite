"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface InvitationRow {
  id: string;
  email: string;
  status: string;
  teamName: string | null;
  teamStatus: string | null;
  createdAt: string;
  expiresAt: string;
}

export function InvitationsClient({
  invitations: initial,
}: {
  invitations: InvitationRow[];
}) {
  const [invitations, setInvitations] = useState(initial);
  const [emailText, setEmailText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const emails = emailText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setEmailText("");

      // Refresh invitations list
      const listRes = await fetch("/api/admin/invitations");
      const listData = await listRes.json();
      setInvitations(
        listData.map((inv: InvitationRow & { createdAt: string; expiresAt: string }) => ({
          id: inv.id,
          email: inv.email,
          status: inv.status,
          teamName: inv.teamName ?? null,
          teamStatus: inv.teamStatus ?? null,
          createdAt: inv.createdAt,
          expiresAt: inv.expiresAt,
        }))
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setSending(false);
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "USED":
        return <Badge className="bg-green-900/30 text-green-400 border-green-800">Used</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk invite form */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Send Invitations
        </h2>
        <Textarea
          placeholder="Enter email addresses (one per line, or comma/semicolon separated)"
          rows={5}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <Button onClick={handleSend} disabled={sending}>
          {sending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 size-4" />
          )}
          Send Invitations
        </Button>
      </div>

      {/* Invitations table */}
      {invitations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No invitations sent yet
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell>
                    {inv.teamName ? (
                      <span className="text-sm">{inv.teamName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
