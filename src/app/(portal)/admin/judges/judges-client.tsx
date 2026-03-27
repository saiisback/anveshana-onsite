"use client";

import { useState, useMemo } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gavel,
  Loader2,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

interface Judge {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  stallNumber: number | null;
}

interface Assignment {
  id: string;
  judgeId: string;
  teamId: string;
  judgeName: string;
  judgeEmail: string;
  teamName: string;
  stallNumber: number | null;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: string;
  score: number | null;
}

interface JudgesClientProps {
  judges: Judge[];
  teams: Team[];
  assignments: Assignment[];
}

export function JudgesClient({ judges, teams, assignments: initialAssignments }: JudgesClientProps) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [filterJudge, setFilterJudge] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({ timeSlotStart: "", timeSlotEnd: "", judgeId: "", teamId: "" });
  const [createForm, setCreateForm] = useState({ judgeId: "", teamId: "", timeSlotStart: "", timeSlotEnd: "" });
  const [creating, setCreating] = useState(false);

  // Compute judge stats from assignments
  const judgeStats = useMemo(() => {
    return judges.map((judge) => {
      const judgeAssignments = assignments.filter((a) => a.judgeId === judge.id);
      const completed = judgeAssignments.filter((a) => a.status === "COMPLETED");
      const scores = completed.map((a) => a.score).filter((s): s is number => s !== null);
      const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";

      return {
        ...judge,
        totalAssignments: judgeAssignments.length,
        completedAssignments: completed.length,
        averageScore: avgScore,
      };
    });
  }, [judges, assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (filterJudge !== "all" && a.judgeId !== filterJudge) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      return true;
    });
  }, [assignments, filterJudge, filterStatus]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/judges/assignments/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setAssignments((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Assignment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function openEdit(assignment: Assignment) {
    setEditAssignment(assignment);
    setEditForm({
      timeSlotStart: assignment.timeSlotStart.slice(0, 16),
      timeSlotEnd: assignment.timeSlotEnd.slice(0, 16),
      judgeId: assignment.judgeId,
      teamId: assignment.teamId,
    });
  }

  async function handleEdit() {
    if (!editAssignment) return;
    setEditLoading(true);
    try {
      const body: Record<string, string> = {};
      if (editForm.timeSlotStart !== editAssignment.timeSlotStart.slice(0, 16)) {
        body.timeSlotStart = new Date(editForm.timeSlotStart).toISOString();
      }
      if (editForm.timeSlotEnd !== editAssignment.timeSlotEnd.slice(0, 16)) {
        body.timeSlotEnd = new Date(editForm.timeSlotEnd).toISOString();
      }
      if (editForm.judgeId !== editAssignment.judgeId) body.judgeId = editForm.judgeId;
      if (editForm.teamId !== editAssignment.teamId) body.teamId = editForm.teamId;

      if (Object.keys(body).length === 0) {
        setEditAssignment(null);
        return;
      }

      const res = await fetch(`/api/admin/judges/assignments/${editAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      // Refresh: update the assignment in local state
      const updatedJudge = judges.find((j) => j.id === editForm.judgeId);
      const updatedTeam = teams.find((t) => t.id === editForm.teamId);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editAssignment.id
            ? {
                ...a,
                ...(body.timeSlotStart && { timeSlotStart: body.timeSlotStart }),
                ...(body.timeSlotEnd && { timeSlotEnd: body.timeSlotEnd }),
                ...(body.judgeId && {
                  judgeId: body.judgeId,
                  judgeName: updatedJudge?.name ?? a.judgeName,
                  judgeEmail: updatedJudge?.email ?? a.judgeEmail,
                }),
                ...(body.teamId && {
                  teamId: body.teamId,
                  teamName: updatedTeam?.name ?? a.teamName,
                  stallNumber: updatedTeam?.stallNumber ?? a.stallNumber,
                }),
              }
            : a
        )
      );
      toast.success("Assignment updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setEditLoading(false);
      setEditAssignment(null);
    }
  }

  async function handleCreate() {
    if (!createForm.judgeId || !createForm.teamId || !createForm.timeSlotStart || !createForm.timeSlotEnd) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/judges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: [
            {
              judgeId: createForm.judgeId,
              teamId: createForm.teamId,
              timeSlotStart: new Date(createForm.timeSlotStart).toISOString(),
              timeSlotEnd: new Date(createForm.timeSlotEnd).toISOString(),
            },
          ],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create assignment");
      }

      toast.success("Assignment created — refresh to see updates");
      setCreateForm({ judgeId: "", teamId: "", timeSlotStart: "", timeSlotEnd: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Judge Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage judges, assignments, and schedules.
        </p>
      </div>

      <Tabs defaultValue="judges">
        <TabsList>
          <TabsTrigger value="judges">Judges</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="create">Create Schedule</TabsTrigger>
        </TabsList>

        {/* Judges Tab */}
        <TabsContent value="judges" className="mt-4">
          {judgeStats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gavel className="mb-3 size-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">No judges found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judgeStats.map((judge) => (
                    <TableRow key={judge.id}>
                      <TableCell className="font-medium">{judge.name}</TableCell>
                      <TableCell className="text-sm">{judge.email}</TableCell>
                      <TableCell className="text-center">{judge.totalAssignments}</TableCell>
                      <TableCell className="text-center">{judge.completedAssignments}</TableCell>
                      <TableCell className="text-center">{judge.averageScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filterJudge} onValueChange={(v) => setFilterJudge(v ?? "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by judge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Judges</SelectItem>
                {judges.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gavel className="mb-3 size-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">No assignments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judge</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.judgeName}</TableCell>
                      <TableCell>
                        {a.teamName}
                        {a.stallNumber != null && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (#{a.stallNumber})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(a.timeSlotStart).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        })}
                        {" – "}
                        {new Date(a.timeSlotEnd).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[a.status] ?? ""}>
                          {STATUS_LABELS[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {a.score != null ? a.score : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(a)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(a.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Create Schedule Tab */}
        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="size-4 text-primary" />
                Create Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Judge</Label>
                  <Select
                    value={createForm.judgeId}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, judgeId: v ?? "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select judge" />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select
                    value={createForm.teamId}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, teamId: v ?? "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {t.stallNumber != null && ` (#${t.stallNumber})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={createForm.timeSlotStart}
                    onChange={(e) => setCreateForm((f) => ({ ...f, timeSlotStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={createForm.timeSlotEnd}
                    onChange={(e) => setCreateForm((f) => ({ ...f, timeSlotEnd: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 size-4" />
                )}
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editAssignment} onOpenChange={(open) => !open && setEditAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judge</Label>
              <Select
                value={editForm.judgeId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, judgeId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {judges.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select
                value={editForm.teamId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, teamId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={editForm.timeSlotStart}
                onChange={(e) => setEditForm((f) => ({ ...f, timeSlotStart: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={editForm.timeSlotEnd}
                onChange={(e) => setEditForm((f) => ({ ...f, timeSlotEnd: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditAssignment(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
