"use client";

import { SessionProvider } from "next-auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "@/components/ui/sonner";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ConvexProvider client={convex}>
        {children}
        <Toaster position="top-right" richColors />
      </ConvexProvider>
    </SessionProvider>
  );
}
