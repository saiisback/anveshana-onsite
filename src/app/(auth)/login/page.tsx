"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FlaskConical, Loader2 } from "lucide-react";

const roleRedirects: Record<string, string> = {
  ADMIN: "/admin",
  VOLUNTEER: "/volunteer",
  JUDGE: "/admin",
  PARTICIPANT: "/participant",
};

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isPending && session) {
      const role = (session.user as { role?: string })?.role ?? "PARTICIPANT";
      router.replace(roleRedirects[role] ?? "/participant");
    }
  }, [isPending, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const role =
        (result.data?.user as { role?: string })?.role ?? "PARTICIPANT";
      router.push(roleRedirects[role] ?? "/participant");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (isPending || session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md bg-black">
        <CardHeader className="text-center">
          <Image src="/anveshana.png" alt="Anveshana" width={100} height={100} className="mx-auto mb-4" />
          <CardTitle className="font-mono text-xl">Welcome to Anveshana</CardTitle>
          <CardDescription>
            Sign in to access the on-site portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive-foreground">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Check your email for an invite link to register.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
