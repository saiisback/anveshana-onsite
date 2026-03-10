"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  BellOff,
} from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

const notificationIcon: Record<string, React.ReactNode> = {
  help_request: <AlertTriangle className="size-5 text-orange-500" />,
  schedule: <Clock className="size-5 text-blue-500" />,
  announcement: <Bell className="size-5 text-purple-500" />,
  check_in: <CheckCircle className="size-5 text-green-500" />,
  general: <Info className="size-5 text-muted-foreground" />,
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function VolunteerNotificationsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const notifications = useQuery(
    api.notifications.listByUser,
    userId ? { userId } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const hasUnread = notifications?.some((n) => !n.read);

  function handleMarkAsRead(notificationId: Id<"notifications">) {
    markAsRead({ notificationId });
  }

  function handleMarkAllAsRead() {
    if (userId) {
      markAllAsRead({ userId });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on help requests and event activity
          </p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-1.5 size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="mb-3 size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              You&apos;ll see updates about help requests and assignments here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                !notification.read ? "border-primary/30 bg-primary/5" : ""
              }`}
              onClick={() => {
                if (!notification.read) {
                  handleMarkAsRead(notification._id);
                }
              }}
            >
              <CardHeader className="pb-1">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {notificationIcon[notification.type] ?? (
                      <Info className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        {notification.title}
                      </CardTitle>
                      {!notification.read && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <CardDescription className="mt-0.5">
                      {notification.message}
                    </CardDescription>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(notification._creationTime)}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
