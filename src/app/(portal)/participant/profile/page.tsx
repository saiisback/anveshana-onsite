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
import { User, Mail, Users, MapPin, QrCode } from "lucide-react";
import { ProfileQRCode } from "./profile-qr";

export default async function ParticipantProfilePage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              members: { include: { user: true } },
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const team = user.teamMembers?.[0]?.team;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
          Your Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account information and team QR code
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="size-4" />
                Name
              </div>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                Email
              </div>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                Team
              </div>
              <span className="font-medium">{team?.name ?? "Not assigned"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                Stall Number
              </div>
              <span className="font-medium">
                {team?.stallNumber ? `#${team.stallNumber}` : "Not assigned"}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge
                variant={team?.status === "APPROVED" ? "default" : "secondary"}
              >
                {team?.status ?? "PENDING"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="size-4 text-primary" />
              Team QR Code
            </CardTitle>
            <CardDescription>
              Show this to volunteers for check-in and food distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            {team?.qrCode ? (
              <ProfileQRCode value={team.qrCode} teamName={team.name} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <QrCode className="size-16 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-muted-foreground">
                    QR Code Not Available
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {team
                      ? "Your team is pending approval. QR code will be generated once approved."
                      : "You are not assigned to a team yet."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      {team && team.members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Team Members
            </CardTitle>
            <CardDescription>
              All members of {team.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  {member.roleInTeam === "lead" && (
                    <Badge variant="default" className="text-xs">
                      Lead
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
