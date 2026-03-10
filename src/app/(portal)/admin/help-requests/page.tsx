"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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

type Status = "OPEN" | "CLAIMED" | "IN_PROGRESS" | "RESOLVED";
type Category = "Technical" | "Logistics" | "Judge" | "Other";
type Urgency = "Low" | "Medium" | "High";

export default function AdminHelpRequestsPage() {
  const allRequests = useQuery(api.helpRequests.list, {});

  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<Category | "ALL">("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRequests = (allRequests ?? []).filter((req) => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && req.category !== categoryFilter) return false;
    if (urgencyFilter !== "ALL" && req.urgency !== urgencyFilter) return false;
    return true;
  });

  const openCount = allRequests?.filter((r) => r.status === "OPEN").length ?? 0;
  const inProgressCount =
    allRequests?.filter(
      (r) => r.status === "CLAIMED" || r.status === "IN_PROGRESS"
    ).length ?? 0;
  const resolvedCount =
    allRequests?.filter((r) => r.status === "RESOLVED").length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">Help Requests</h1>
        <p className="text-muted-foreground">
          Overview of all participant help requests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {openCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {inProgressCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {resolvedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as Status | "ALL")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLAIMED">Claimed</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(val) => setCategoryFilter(val as Category | "ALL")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="Technical">Technical</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
            <SelectItem value="Judge">Judge</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={urgencyFilter}
          onValueChange={(val) => setUrgencyFilter(val as Urgency | "ALL")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Urgencies</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {allRequests === undefined ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No help requests match the current filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <>
                    <TableRow
                      key={req._id}
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === req._id ? null : req._id
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {req.teamName}
                        {req.stallNumber !== undefined && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (#{req.stallNumber})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={URGENCY_COLORS[req.urgency]}
                        >
                          {req.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[req.status]}
                        >
                          {req.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.volunteerName ?? (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(req._creationTime).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {expandedId === req._id && (
                      <TableRow key={`${req._id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="space-y-2 py-2">
                            <p className="text-sm font-medium">Description</p>
                            <p className="text-sm text-muted-foreground">
                              {req.description || "No description provided."}
                            </p>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                              <span>Team ID: {req.teamId}</span>
                              {req.volunteerId && (
                                <span>Volunteer ID: {req.volunteerId}</span>
                              )}
                              <span>
                                Request ID: {req._id}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
