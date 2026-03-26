"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useSession } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CLAIMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const URGENCY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function VolunteerRequestsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const volunteerId = session?.user?.id ?? "";
  const volunteerName = session?.user?.name ?? "";

  const allRequests = useQuery(api.helpRequests.list, {});
  const myRequests = useQuery(api.helpRequests.listByVolunteer, { volunteerId: volunteerId || "none" });
  const claimRequest = useMutation(api.helpRequests.claim);
  const updateStatus = useMutation(api.helpRequests.updateStatus);

  const [activeTab, setActiveTab] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const openRequests = allRequests?.filter((r) => r.status === "OPEN") ?? [];
  const activeRequests = allRequests?.filter(
    (r) => r.status !== "RESOLVED"
  ) ?? [];

  const displayedRequests =
    activeTab === "open"
      ? openRequests
      : activeTab === "mine"
        ? (myRequests ?? [])
        : activeRequests;

  const handleClaim = async (helpRequestId: Id<"helpRequests">) => {
    setLoadingId(helpRequestId);
    try {
      await claimRequest({ helpRequestId, volunteerId, volunteerName });
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateStatus = async (
    helpRequestId: Id<"helpRequests">,
    status: "IN_PROGRESS" | "RESOLVED"
  ) => {
    setLoadingId(helpRequestId);
    try {
      await updateStatus({ helpRequestId, status });
    } finally {
      setLoadingId(null);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <p className="text-center text-sm text-muted-foreground">
          Unable to load session. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">Help Requests</h1>
        <p className="text-muted-foreground">
          View and respond to participant help requests in real time.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="all">
            All ({activeRequests.length})
          </TabsTrigger>
          <TabsTrigger value="open">
            Open ({openRequests.length})
          </TabsTrigger>
          <TabsTrigger value="mine">
            My Requests ({myRequests?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {["all", "open", "mine"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 w-full">
            {allRequests === undefined ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : displayedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {tab === "open"
                    ? "No open requests right now."
                    : tab === "mine"
                      ? "You have not claimed any requests yet."
                      : "No active help requests."}
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-3">
              {displayedRequests.map((req) => (
                <Card key={req._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>{req.teamName}</span>
                      {req.stallNumber !== undefined && (
                        <span className="text-sm font-normal text-muted-foreground">
                          Stall #{req.stallNumber}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[req.status]}
                      >
                        {req.status.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={URGENCY_COLORS[req.urgency]}
                      >
                        {req.urgency}
                      </Badge>
                      <Badge variant="outline">{req.category}</Badge>
                    </div>

                    {req.description && (
                      <p className="text-sm">{req.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {req.volunteerName && (
                        <span>Volunteer: {req.volunteerName}</span>
                      )}
                      <span>
                        Created: {new Date(req._creationTime).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    {req.status === "OPEN" && (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(req._id)}
                        disabled={loadingId === req._id}
                      >
                        {loadingId === req._id ? "Claiming..." : "Claim"}
                      </Button>
                    )}
                    {req.status === "CLAIMED" &&
                      req.volunteerId === volunteerId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateStatus(req._id, "IN_PROGRESS")
                          }
                          disabled={loadingId === req._id}
                        >
                          {loadingId === req._id ? "Starting..." : "Start"}
                        </Button>
                      )}
                    {req.status === "IN_PROGRESS" &&
                      req.volunteerId === volunteerId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleUpdateStatus(req._id, "RESOLVED")
                          }
                          disabled={loadingId === req._id}
                        >
                          {loadingId === req._id ? "Resolving..." : "Resolve"}
                        </Button>
                      )}
                  </CardFooter>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
