"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  HelpCircle,
  Map,
  Bell,
  ScanLine,
  Inbox,
  Users,
  UserCheck,
  Gavel,
  Settings,
  LogOut,
  Menu,
  FlaskConical,
} from "lucide-react";
import { useState } from "react";

type Role = "PARTICIPANT" | "VOLUNTEER" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: Record<Role, NavItem[]> = {
  PARTICIPANT: [
    { label: "Dashboard", href: "/participant", icon: <LayoutDashboard className="size-5" /> },
    { label: "Schedule", href: "/participant/schedule", icon: <Calendar className="size-5" /> },
    { label: "Help", href: "/participant/help", icon: <HelpCircle className="size-5" /> },
    { label: "Map", href: "/participant/map", icon: <Map className="size-5" /> },
    { label: "Notifications", href: "/participant/notifications", icon: <Bell className="size-5" /> },
  ],
  VOLUNTEER: [
    { label: "Dashboard", href: "/volunteer", icon: <LayoutDashboard className="size-5" /> },
    { label: "Scanner", href: "/volunteer/scan", icon: <ScanLine className="size-5" /> },
    { label: "Requests", href: "/volunteer/requests", icon: <Inbox className="size-5" /> },
    { label: "Map", href: "/volunteer/map", icon: <Map className="size-5" /> },
    { label: "Notifications", href: "/volunteer/notifications", icon: <Bell className="size-5" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="size-5" /> },
    { label: "Registrations", href: "/admin/registrations", icon: <Users className="size-5" /> },
    { label: "Teams", href: "/admin/teams", icon: <Users className="size-5" /> },
    { label: "Judges", href: "/admin/judges", icon: <Gavel className="size-5" /> },
    { label: "Volunteers", href: "/admin/volunteers", icon: <UserCheck className="size-5" /> },
    { label: "Notifications", href: "/admin/notifications", icon: <Bell className="size-5" /> },
    { label: "Help Requests", href: "/admin/help-requests", icon: <HelpCircle className="size-5" /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings className="size-5" /> },
  ],
};

interface SidebarProps {
  role: Role;
  userName?: string;
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  role,
  userName,
  pathname,
  onNavigate,
}: SidebarProps & { pathname: string; onNavigate?: () => void }) {
  const items = navItems[role];
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <FlaskConical className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground">Anveshana</h1>
          <p className="text-xs text-muted-foreground">On-Site Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks items={items} pathname={pathname} onNavigate={onNavigate} />
      </div>

      {/* User info & Logout */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground">
            {userName || "User"}
          </p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-primary/5 hover:text-foreground"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent role={role} userName={userName} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-border bg-sidebar px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-primary/10"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar p-0 border-border">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              role={role}
              userName={userName}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <FlaskConical className="size-5 text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">Anveshana</span>
        </div>
      </div>
    </>
  );
}
