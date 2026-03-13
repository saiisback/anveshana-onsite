"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PendingTeam {
  id: string;
  name: string;
  leadEmail: string;
  membersCount: number;
  powerOutlet: boolean;
  internetNeeded: boolean;
  tableSize: string | null;
  additionalRequirements: string | null;
  paymentScreenshot: string | null;
  createdAt: string;
}

export function RegistrationsClient({ teams }: { teams: PendingTeam[] }) {
  const [pendingTeams, setPendingTeams] = useState(teams);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  async function handleApprove(teamId: string) {
    setLoadingId(teamId);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve team");
      }
      setPendingTeams((prev) => prev.filter((t) => t.id !== teamId));
      toast.success("Team approved — password setup emails sent to all members");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve team"
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(teamId: string) {
    setLoadingId(teamId);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/reject`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject team");
      }
      setPendingTeams((prev) => prev.filter((t) => t.id !== teamId));
      toast.success("Team rejected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject team"
      );
    } finally {
      setLoadingId(null);
    }
  }

  if (pendingTeams.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No pending RSVPs
        </p>
        <p className="text-sm text-muted-foreground/70">
          All team RSVPs have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Lead Email</TableHead>
            <TableHead className="text-center">Members</TableHead>
            <TableHead>Requirements</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingTeams.map((team) => {
            const isLoading = loadingId === team.id;
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell className="text-sm">{team.leadEmail}</TableCell>
                <TableCell className="text-center">
                  {team.membersCount}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {team.powerOutlet && (
                      <Badge variant="secondary" className="text-xs">
                        Power
                      </Badge>
                    )}
                    {team.internetNeeded && (
                      <Badge variant="secondary" className="text-xs">
                        Internet
                      </Badge>
                    )}
                    {team.tableSize && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {team.tableSize}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {team.paymentScreenshot ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage(team.paymentScreenshot)
                        }
                        className="relative size-12 overflow-hidden rounded border border-border hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                      >
                        <Image
                          src={team.paymentScreenshot}
                          alt="Payment screenshot"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                      <a
                        href={team.paymentScreenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(team.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(team.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1.5 size-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(team.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-1.5 size-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle>Payment Screenshot</DialogTitle>
          {previewImage && (
            <div className="relative w-full max-h-[70vh] overflow-auto">
              <Image
                src={previewImage}
                alt="Payment screenshot"
                width={800}
                height={600}
                className="w-full h-auto rounded"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
