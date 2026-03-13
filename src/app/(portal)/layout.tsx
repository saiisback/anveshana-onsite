import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getSession, getUserRole } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const castRole = getUserRole(session);
  const hasBottomNav = castRole === "PARTICIPANT" || castRole === "VOLUNTEER";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        role={castRole}
        userName={session.user?.name ?? undefined}
      />

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen lg:ml-64 lg:pt-0",
          hasBottomNav
            ? "pb-20 pt-0"   /* bottom navbar: no top bar, add bottom padding */
            : "pt-16"        /* admin: top bar hamburger menu */
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
