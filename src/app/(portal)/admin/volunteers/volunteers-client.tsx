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
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

interface VolunteerRequest {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
}

export function VolunteersClient({
  requests: initialRequests,
}: {
  requests: VolunteerRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  const filteredRequests = requests.filter((r) =>
    filter === "ALL" ? true : r.status === filter
  );

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve request");
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const } : r))
      );
      toast.success("Volunteer approved — password setup email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}/reject`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject request");
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r))
      );
      toast.success("Request rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="gap-1.5"
          >
            {status === "PENDING" && <Clock className="size-3.5" />}
            {status === "APPROVED" && <UserCheck className="size-3.5" />}
            {status === "REJECTED" && <UserX className="size-3.5" />}
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts[status]}
            </Badge>
          </Button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No {filter === "ALL" ? "" : filter.toLowerCase()} requests
          </p>
          <p className="text-sm text-muted-foreground/70">
            {filter === "PENDING"
              ? "All volunteer requests have been reviewed."
              : "No volunteer requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "APPROVED"
                          ? "default"
                          : request.status === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(request.id)}
                          disabled={loadingId === request.id}
                        >
                          {loadingId === request.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle className="size-4" />
                          )}
                          <span className="ml-1.5 hidden sm:inline">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={loadingId === request.id}
                        >
                          {loadingId === request.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                          <span className="ml-1.5 hidden sm:inline">Reject</span>
                        </Button>
                      </div>
                    )}
                    {request.status !== "PENDING" && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
