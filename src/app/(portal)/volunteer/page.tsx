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
import {
  MapPin,
  Inbox,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default async function VolunteerDashboard() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      volunteerZones: true,
    },
  });

  const zone = user?.volunteerZones?.[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Welcome, {session.user.name ?? "Volunteer"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is your volunteer dashboard with assigned tasks and activity.
        </p>
      </div>

      {/* Quick info - stacked on mobile, 3 cols on tablet+ */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardDescription>Assigned Zone</CardDescription>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="size-4 text-primary" />
              {zone
                ? `${zone.zoneName} (${zone.building}, Floor ${zone.floor})`
                : "No zone assigned"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardDescription>Help Requests</CardDescription>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Inbox className="size-4 text-orange-500" />
              <Link
                href="/volunteer/requests"
                className="text-primary hover:underline"
              >
                View Live Requests
              </Link>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardDescription>Quick Actions</CardDescription>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="size-4 text-primary" />
              <Link
                href="/volunteer/scan"
                className="text-primary hover:underline"
              >
                Scan QR Code
              </Link>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Action cards - stacked on mobile */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
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
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Inbox className="size-4" />
              View Requests Feed
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              Team Check-ins
            </CardTitle>
            <CardDescription>Scan team QR codes to check them in</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/volunteer/scan"
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
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
