"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const role = (session?.user as { role?: string })?.role?.toLowerCase() ?? "participant";

  const unreadCount = useQuery(
    api.notifications.countUnread,
    userId ? { userId } : "skip"
  );

  const notificationsPath =
    role === "admin"
      ? "/admin/notifications"
      : role === "volunteer"
        ? "/volunteer/notifications"
        : "/participant/notifications";

  return (
    <Link
      href={notificationsPath}
      className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="size-5" />
      {typeof unreadCount === "number" && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
