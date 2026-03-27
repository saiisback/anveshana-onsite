"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
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
  Megaphone,
} from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

type AnnouncementRole = "ALL" | "PARTICIPANT" | "VOLUNTEER" | "ADMIN";

interface NotificationsPageProps {
  title: string;
  subtitle: string;
  emptyDescription: string;
  userId: string;
  userRole?: AnnouncementRole;
}

const notificationIcon: Record<string, React.ReactNode> = {
  help_request: <AlertTriangle className="size-5 text-orange-500" />,
  schedule: <Clock className="size-5 text-blue-500" />,
  announcement: <Megaphone className="size-5 text-purple-500" />,
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

interface FeedItem {
  key: string;
  type: "notification" | "announcement";
  icon: React.ReactNode;
  title: string;
  message: string;
  time: number;
  read: boolean;
  notificationId?: Id<"notifications">;
}

export default function NotificationsPage({
  title,
  subtitle,
  emptyDescription,
  userId,
  userRole,
}: NotificationsPageProps) {
  const notifications = useQuery(
    api.notifications.listByUser,
    userId ? { userId } : "skip"
  );
  const announcements = useQuery(
    api.announcements.list,
    userRole ? { targetRole: userRole as AnnouncementRole } : {}
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const isLoading = notifications === undefined || announcements === undefined;

  // Merge notifications and announcements into a single feed
  const feed: FeedItem[] = [];

  if (notifications) {
    for (const n of notifications) {
      feed.push({
        key: `n-${n._id}`,
        type: "notification",
        icon: notificationIcon[n.type] ?? <Info className="size-5 text-muted-foreground" />,
        title: n.title,
        message: n.message,
        time: n._creationTime,
        read: n.read,
        notificationId: n._id,
      });
    }
  }

  if (announcements) {
    // Collect notification titles+times to avoid showing duplicate announcement entries
    const notifKeys = new Set(
      (notifications ?? []).map((n) => `${n.title}|${n.message}`)
    );

    for (const a of announcements) {
      // Skip if there's already a notification with the same title and message
      if (notifKeys.has(`${a.title}|${a.message}`)) continue;

      feed.push({
        key: `a-${a._id}`,
        type: "announcement",
        icon: <Megaphone className="size-5 text-purple-500" />,
        title: a.title,
        message: a.message,
        time: a._creationTime,
        read: true, // announcements don't have read state
      });
    }
  }

  // Sort by time descending
  feed.sort((a, b) => b.time - a.time);

  const hasUnread = feed.some((f) => !f.read);

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
          <h1 className="font-mono text-xl font-bold text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-1.5 size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="mb-3 size-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground/70">
              {emptyDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feed.map((item) => (
            <Card
              key={item.key}
              className={`transition-colors ${
                !item.read
                  ? "cursor-pointer border-primary/30 bg-primary/5 hover:bg-muted/30"
                  : ""
              }`}
              onClick={() => {
                if (!item.read && item.notificationId) {
                  handleMarkAsRead(item.notificationId);
                }
              }}
            >
              <CardHeader className="pb-1">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        {item.title}
                      </CardTitle>
                      {!item.read && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <CardDescription className="mt-0.5 whitespace-pre-wrap">
                      {item.message}
                    </CardDescription>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(item.time)}
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
