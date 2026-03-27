"use client";

import { useSession } from "@/lib/auth-client";
import NotificationsPage from "@/components/notifications-page";

export default function ParticipantNotificationsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  return (
    <NotificationsPage
      title="Notifications"
      subtitle="Stay updated on your event activity"
      emptyDescription="You'll see updates about your team and the event here."
      userId={userId}
      userRole="PARTICIPANT"
    />
  );
}
