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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Users,
  Zap,
  Wifi,
  Table2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  name: string;
  email: string;
  roleInTeam: string;
}

interface PendingTeam {
  id: string;
  name: string;
  prototypeTitle: string | null;
  description: string | null;
  category: string | null;
  leadEmail: string;
  membersCount: number;
  members: TeamMember[];
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
  const [selectedTeam, setSelectedTeam] = useState<PendingTeam | null>(null);

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
      setSelectedTeam(null);
      toast.success(
        "Team approved — password setup emails sent to all members"
      );
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
      setSelectedTeam(null);
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

  const isLoading = selectedTeam ? loadingId === selectedTeam.id : false;

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Lead Email</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTeams.map((team) => (
              <TableRow
                key={team.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTeam(team)}
              >
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
                      <Badge
                        variant="secondary"
                        className="text-xs capitalize"
                      >
                        {team.tableSize}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(team.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      >
        {selectedTeam && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg">
                  {selectedTeam.name}
                </DialogTitle>
                {selectedTeam.category && (
                  <Badge variant="outline" className="capitalize">
                    {selectedTeam.category}
                  </Badge>
                )}
              </div>
              {(selectedTeam.prototypeTitle || selectedTeam.description) && (
                <div className="space-y-0.5">
                  {selectedTeam.prototypeTitle && (
                    <p className="text-sm font-medium text-foreground">
                      {selectedTeam.prototypeTitle}
                    </p>
                  )}
                  {selectedTeam.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTeam.description}
                    </p>
                  )}
                </div>
              )}
            </DialogHeader>

            {/* Two-column horizontal layout */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Left column — Members + Requirements */}
              <div className="space-y-4">
                {/* Members */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Users className="size-4 text-primary" />
                    Members ({selectedTeam.members.length})
                  </div>
                  <div className="space-y-1.5 rounded-md border p-3">
                    {selectedTeam.members.map((m) => (
                      <div
                        key={m.email}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.roleInTeam === "lead" && (
                            <Badge variant="default" className="text-[10px]">
                              Lead
                            </Badge>
                          )}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeam.powerOutlet && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="size-3" /> Power Outlet
                      </Badge>
                    )}
                    {selectedTeam.internetNeeded && (
                      <Badge variant="secondary" className="gap-1">
                        <Wifi className="size-3" /> Internet
                      </Badge>
                    )}
                    {selectedTeam.tableSize && (
                      <Badge variant="secondary" className="gap-1 capitalize">
                        <Table2 className="size-3" /> {selectedTeam.tableSize}{" "}
                        table
                      </Badge>
                    )}
                    {!selectedTeam.powerOutlet &&
                      !selectedTeam.internetNeeded &&
                      !selectedTeam.tableSize && (
                        <span className="text-sm text-muted-foreground">
                          None
                        </span>
                      )}
                  </div>
                  {selectedTeam.additionalRequirements && (
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <FileText className="mt-0.5 size-3.5 shrink-0" />
                      {selectedTeam.additionalRequirements}
                    </div>
                  )}
                </div>

                {/* Submitted date */}
                <p className="text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(selectedTeam.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {/* Right column — Payment Screenshot */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Screenshot</p>
                {selectedTeam.paymentScreenshot ? (
                  <div className="space-y-2">
                    <div className="relative max-h-[50vh] overflow-auto rounded-md border">
                      <Image
                        src={selectedTeam.paymentScreenshot}
                        alt="Payment screenshot"
                        width={800}
                        height={600}
                        className="h-auto w-full"
                        unoptimized
                      />
                    </div>
                    <a
                      href={selectedTeam.paymentScreenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open full size <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No screenshot uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Actions — full width at bottom */}
            <div className="flex items-center gap-2 border-t pt-4">
              <Button
                className="flex-1"
                onClick={() => handleApprove(selectedTeam.id)}
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
                className="flex-1"
                variant="outline"
                onClick={() => handleReject(selectedTeam.id)}
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
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
