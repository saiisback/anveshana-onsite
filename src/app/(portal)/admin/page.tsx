import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  HelpCircle,
  Gavel,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const [totalTeams, approvedTeams, totalJudges] = await Promise.all([
    prisma.team.count(),
    prisma.team.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "JUDGE" } }),
  ]);

  const recentTeams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { members: true },
  });

  const stats = [
    {
      label: "Total Teams",
      value: totalTeams,
      icon: <Users className="size-5 text-indigo-500" />,
      href: "/admin/teams",
    },
    {
      label: "Approved",
      value: approvedTeams,
      icon: <UserCheck className="size-5 text-emerald-500" />,
      href: "/admin/teams",
    },
    {
      label: "Help Requests",
      value: "Live",
      icon: <HelpCircle className="size-5 text-orange-500" />,
      href: "/admin/help-requests",
    },
    {
      label: "Judges",
      value: totalJudges,
      icon: <Gavel className="size-5 text-violet-500" />,
      href: "/admin/judges",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of the Anveshana 2026 event.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl">{stat.value}</span>
                  {stat.icon}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-indigo-500" />
                Recent Registrations
              </CardTitle>
              <Link
                href="/admin/registrations"
                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            <CardDescription>Latest team registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTeams.length > 0 ? (
              <div className="space-y-3">
                {recentTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-slate-500">
                        {team.members.length} members &middot;{" "}
                        <Clock className="mr-0.5 inline size-3" />
                        {new Date(team.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        team.status === "APPROVED" ? "default" : "secondary"
                      }
                    >
                      {team.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No registrations yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4 text-orange-500" />
              Help Requests
            </CardTitle>
            <CardDescription>
              View real-time help requests on the{" "}
              <Link
                href="/admin/help-requests"
                className="text-indigo-600 hover:underline"
              >
                Help Requests page
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
