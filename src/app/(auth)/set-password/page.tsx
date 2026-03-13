import { validatePasswordSetupToken } from "@/lib/tokens";
import SetPasswordClient from "./set-password-client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">No Token Provided</h2>
              <p className="text-sm text-muted-foreground">
                Please use the link from your email to set your password.
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
    );
  }

  const setupToken = await validatePasswordSetupToken(token);

  if (!setupToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Invalid or Expired Link</h2>
              <p className="text-sm text-muted-foreground">
                This password setup link is invalid, has already been used, or
                has expired. Please contact the organizers.
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
    );
  }

  return (
    <SetPasswordClient
      token={token}
      userName={setupToken.user.name}
    />
  );
}
