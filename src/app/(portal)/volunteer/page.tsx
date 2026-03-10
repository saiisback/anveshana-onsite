import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Inbox,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default async function VolunteerDashboard() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      volunteerZones: true,
    },
  });

  const zone = user?.volunteerZones?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {session.user.name ?? "Volunteer"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here is your volunteer dashboard with assigned tasks and activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Assigned Zone</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-emerald-500" />
              {zone
                ? `${zone.zoneName} (${zone.building}, Floor ${zone.floor})`
                : "No zone assigned"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Help Requests</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="size-4 text-orange-500" />
              <Link
                href="/volunteer/requests"
                className="text-indigo-600 hover:underline"
              >
                View Live Requests
              </Link>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Quick Actions</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-indigo-500" />
              <Link
                href="/volunteer/scan"
                className="text-indigo-600 hover:underline"
              >
                Scan QR Code
              </Link>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="size-4 text-orange-500" />
              Help Requests
            </CardTitle>
            <CardDescription>
              View and claim real-time help requests from teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/volunteer/requests"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Inbox className="size-4" />
              View Requests Feed
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-indigo-500" />
              Team Check-ins
            </CardTitle>
            <CardDescription>Scan team QR codes to check them in</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/volunteer/scan"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <MapPin className="size-4" />
              Open QR Scanner
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
