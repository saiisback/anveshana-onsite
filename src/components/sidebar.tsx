"use client";

import Image from "next/image";
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
  BarChart3,
  LogOut,
  Menu,
  Mail,
  Lock,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Role } from "@/generated/prisma/enums";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  locked?: boolean;
}

const navItems: Partial<Record<Role, NavItem[]>> = {
  PARTICIPANT: [
    { label: "Home", href: "/participant", icon: <LayoutDashboard className="size-5" /> },
    { label: "Schedule", href: "/participant/schedule", icon: <Calendar className="size-5" /> },
    { label: "Instructions", href: "/participant/instructions", icon: <BookOpen className="size-5" /> },
    { label: "Help", href: "/participant/help", icon: <HelpCircle className="size-5" />, locked: true },
    { label: "Map", href: "/participant/map", icon: <Map className="size-5" />, locked: true },
    { label: "Alerts", href: "/participant/notifications", icon: <Bell className="size-5" />, locked: true },
  ],
  VOLUNTEER: [
    { label: "Home", href: "/volunteer", icon: <LayoutDashboard className="size-5" /> },
    { label: "Scan", href: "/volunteer/scan", icon: <ScanLine className="size-5" /> },
    { label: "Requests", href: "/volunteer/requests", icon: <Inbox className="size-5" /> },
    { label: "Map", href: "/volunteer/map", icon: <Map className="size-5" /> },
    { label: "Alerts", href: "/volunteer/notifications", icon: <Bell className="size-5" /> },
  ],
  JUDGE: [
    { label: "Dashboard", href: "/judge", icon: <LayoutDashboard className="size-5" /> },
    { label: "Schedule", href: "/judge/schedule", icon: <Calendar className="size-5" /> },
    { label: "Alerts", href: "/judge/notifications", icon: <Bell className="size-5" /> },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="size-5" /> },
    { label: "Invitations", href: "/admin/invitations", icon: <Mail className="size-5" /> },
    { label: "RSVPs", href: "/admin/registrations", icon: <Users className="size-5" /> },
    { label: "Teams", href: "/admin/teams", icon: <Users className="size-5" /> },
    { label: "Judges", href: "/admin/judges", icon: <Gavel className="size-5" /> },
    { label: "Volunteers", href: "/admin/volunteers", icon: <UserCheck className="size-5" /> },
    { label: "Notifications", href: "/admin/notifications", icon: <Bell className="size-5" /> },
    { label: "Help Requests", href: "/admin/help-requests", icon: <HelpCircle className="size-5" /> },
    { label: "Analysis", href: "/admin/analysis", icon: <BarChart3 className="size-5" /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings className="size-5" /> },
  ],
};

const useBottomNav = (role: Role) => role === "PARTICIPANT" || role === "VOLUNTEER" || role === "JUDGE";

function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

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
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          if (item.locked) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <span
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
                  >
                    {item.icon}
                    {item.label}
                    <Lock className="ml-auto size-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Will open on the day of the event</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
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
    </TooltipProvider>
  );
}

function SidebarContent({
  role,
  userName,
  pathname,
  onNavigate,
}: SidebarProps & { pathname: string; onNavigate?: () => void }) {
  const items = navItems[role] ?? [];
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <Image src="/anveshana.png" alt="Anveshana" width={36} height={36} className="rounded-lg" />
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

function BottomNavBar({ role, pathname }: { role: Role; pathname: string }) {
  const items = navItems[role] ?? [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-sidebar lg:hidden">
      <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          if (item.locked) {
            return (
              <span
                key={item.href}
                className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground/40"
              >
                <div className="relative flex size-8 items-center justify-center rounded-xl">
                  {item.icon}
                  <Lock className="absolute -right-0.5 -top-0.5 size-2.5" />
                </div>
                {item.label}
              </span>
            );
          }

          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl transition-colors",
                  active && "bg-primary/15"
                )}
              >
                {item.icon}
              </div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isBottomNav = useBottomNav(role);

  return (
    <>
      {/* Desktop sidebar — all roles */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent role={role} userName={userName} pathname={pathname} />
      </aside>

      {isBottomNav ? (
        /* Mobile bottom navbar — participant & volunteer */
        <BottomNavBar role={role} pathname={pathname} />
      ) : (
        /* Mobile top bar + drawer — admin */
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
            <Image src="/anveshana.png" alt="Anveshana" width={24} height={24} className="rounded" />
            <span className="font-mono text-sm font-bold text-foreground">Anveshana</span>
          </div>
        </div>
      )}
    </>
  );
}
