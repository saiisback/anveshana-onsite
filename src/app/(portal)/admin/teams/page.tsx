import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    where: { status: "APPROVED" },
    include: {
      members: true,
      stallLocation: true,
    },
    orderBy: { stallNumber: "asc" },
  });

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">Approved Teams</h1>
        <p className="text-sm text-muted-foreground">
          All approved teams with stall assignments
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No approved teams yet
          </p>
          <p className="text-sm text-muted-foreground/70">
            Approve teams from the{" "}
            <Link
              href="/admin/registrations"
              className="text-primary underline underline-offset-4"
            >
              RSVPs page
            </Link>{" "}
            to see them here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Prototype</TableHead>
                <TableHead className="text-center">Stall #</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div>{team.name}</div>
                    {team.prototypeTitle && (
                      <div className="text-xs text-muted-foreground">{team.prototypeTitle}</div>
                    )}
                  </TableCell>
                  <TableCell>{team.prototypeTitle}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {team.stallNumber ?? "Unassigned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{team.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {team.members.length}
                  </TableCell>
                  <TableCell>
                    <Badge>Approved</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/teams/${team.id}`}
                      className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      Edit Stall
                    </Link>
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
