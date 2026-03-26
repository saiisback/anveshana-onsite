"use client";

import { useSession } from "@/lib/auth-client";
import NotificationsPage from "@/components/notifications-page";

export default function VolunteerNotificationsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  return (
    <NotificationsPage
      title="Notifications"
      subtitle="Stay updated on help requests and event activity"
      emptyDescription="You'll see updates about help requests and assignments here."
      userId={userId}
    />
  );
}
