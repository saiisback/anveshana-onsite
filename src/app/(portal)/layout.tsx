import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth-server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const role =
    (session.user as { role?: string })?.role ?? "PARTICIPANT";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        role={role as "PARTICIPANT" | "VOLUNTEER" | "ADMIN"}
        userName={session.user?.name ?? undefined}
      />

      {/* Main content */}
      <main className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
