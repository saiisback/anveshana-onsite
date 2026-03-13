import { validateInviteToken } from "@/lib/tokens";
import RegisterClient from "./register-client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import DitherBackground from "@/components/dither-background";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <DitherBackground>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md text-center">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">No Invitation Token</h2>
                <p className="text-sm text-muted-foreground">
                  RSVP is invite-only. Please check your email for an
                  invitation link.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Go Home
              </Link>
            </CardContent>
          </Card>
        </div>
      </DitherBackground>
    );
  }

  const invitation = await validateInviteToken(token);

  if (!invitation) {
    return (
      <DitherBackground>
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md text-center">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Invalid or Expired Link</h2>
                <p className="text-sm text-muted-foreground">
                  This invitation link is invalid, has already been used, or has
                  expired. Please contact the organizers for a new invitation.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Go Home
              </Link>
            </CardContent>
          </Card>
        </div>
      </DitherBackground>
    );
  }

  return (
    <DitherBackground>
      <RegisterClient
        token={token}
        invitedEmail={invitation.email}
      />
    </DitherBackground>
  );
}
