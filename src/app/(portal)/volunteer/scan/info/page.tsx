"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  XCircle,
  Camera,
  RotateCcw,
  User,
  Users,
  MapPin,
  Mail,
  CheckCircle2,
  UtensilsCrossed,
  Shield,
  Layers,
} from "lucide-react";

const USER_QR_PREFIX = "anveshana-user-";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleInTeam: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  team: {
    id: string;
    name: string;
    stallNumber: number | null;
    status: string;
    prototypeTitle: string | null;
    category: string | null;
    members?: TeamMember[];
  } | null;
}

type ScanState =
  | { step: "scanning" }
  | { step: "validating"; visitorId: string }
  | { step: "showing"; visitorId: string; user: UserInfo }
  | { step: "error"; message: string };

export default function InfoScannerPage() {
  const { data: session, isPending: sessionLoading } = useSession();

  const [scanState, setScanState] = useState<ScanState>({ step: "scanning" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader-info";

  const visitorId =
    scanState.step === "showing" ? scanState.visitorId : null;

  const checkIn = useQuery(
    api.checkIns.getByVisitor,
    visitorId ? { visitorId } : "skip"
  );
  const foodDistributions = useQuery(
    api.foodDistributions.getByVisitor,
    visitorId ? { visitorId } : "skip"
  );

  const resetScanner = useCallback(() => {
    setScanState({ step: "scanning" });
    setCameraError(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.render(handleScanSuccess, handleScanError);
      } catch {
        // Scanner may already be rendering
      }
    }
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (!decodedText.startsWith(USER_QR_PREFIX)) {
      setScanState({ step: "error", message: "Not a valid participant QR code" });
      return;
    }

    const id = decodedText.slice(USER_QR_PREFIX.length);
    if (!id) {
      setScanState({ step: "error", message: "Invalid QR code: no user ID found" });
      return;
    }

    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch {
        // Scanner may not support pause
      }
    }

    setScanState({ step: "validating", visitorId: id });

    try {
      const res = await fetch(
        `/api/admin/users/validate?userId=${encodeURIComponent(id)}&includeMembers=true`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanState({
          step: "error",
          message: res.status === 404 ? "User not found" : (data.error ?? "Failed to validate user"),
        });
        return;
      }

      const user: UserInfo = await res.json();
      setScanState({ step: "showing", visitorId: user.id, user });
    } catch {
      setScanState({ step: "error", message: "Network error. Please try again." });
    }
  }, []);

  const handleScanError = useCallback((_errorMessage: string) => {
    // Ignored — fires continuously when no QR is in frame
  }, []);

  useEffect(() => {
    if (sessionLoading || !session?.user) return;

    const scanner = new Html5QrcodeScanner(
      scannerDivId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    try {
      scanner.render(handleScanSuccess, handleScanError);
    } catch {
      setCameraError("Failed to initialize camera. Please check permissions.");
    }

    return () => {
      try {
        scanner.clear();
      } catch {
        // Cleanup may fail if already cleared
      }
      scannerRef.current = null;
    };
  }, [sessionLoading, session?.user, handleScanSuccess, handleScanError]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm text-muted-foreground">
          Unable to load session. Please log in again.
        </p>
      </div>
    );
  }

  const lunchReceived = foodDistributions?.some((d) => d.mealType === "Lunch") ?? false;
  const snackReceived = foodDistributions?.some((d) => d.mealType === "Snack") ?? false;
  const isCheckedIn = !!checkIn;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          See Info
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan a participant&apos;s QR code to view their details.
        </p>
      </div>

      {cameraError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-medium">{cameraError}</p>
              <p className="text-xs text-muted-foreground">
                Make sure you have allowed camera access in your browser settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4" />
            Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            id={scannerDivId}
            className={scanState.step !== "scanning" ? "hidden" : ""}
          />

          {scanState.step === "validating" && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Looking up participant...</span>
            </div>
          )}

          {scanState.step === "error" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="size-8 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {scanState.message}
              </p>
              <Button variant="outline" size="sm" onClick={resetScanner}>
                <RotateCcw className="mr-1.5 size-4" />
                Try Again
              </Button>
            </div>
          )}

          {scanState.step === "showing" && (
            <div className="flex justify-center py-4">
              <Button variant="outline" size="sm" onClick={resetScanner}>
                <RotateCcw className="mr-1.5 size-4" />
                Scan Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      {scanState.step === "showing" && (
        <>
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Participant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="size-3.5" />
                  Name
                </span>
                <span className="text-sm font-medium">{scanState.user.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5" />
                  Email
                </span>
                <span className="text-sm font-medium">{scanState.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Shield className="size-3.5" />
                  Role
                </span>
                <Badge variant="secondary">{scanState.user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Team Info */}
          {scanState.user.team && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4" />
                  Team Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Team Name</span>
                  <span className="text-sm font-medium">{scanState.user.team.name}</span>
                </div>
                {scanState.user.team.prototypeTitle && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Project</span>
                    <span className="text-sm font-medium">{scanState.user.team.prototypeTitle}</span>
                  </div>
                )}
                {scanState.user.team.category && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Layers className="size-3.5" />
                      Category
                    </span>
                    <Badge variant="outline">{scanState.user.team.category}</Badge>
                  </div>
                )}
                {scanState.user.team.stallNumber && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      Stall Number
                    </span>
                    <Badge variant="outline">#{scanState.user.team.stallNumber}</Badge>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      scanState.user.team.status === "APPROVED"
                        ? "default"
                        : scanState.user.team.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {scanState.user.team.status}
                  </Badge>
                </div>

                {/* Team Members */}
                {scanState.user.team.members && scanState.user.team.members.length > 0 && (
                  <div className="pt-1">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Members</p>
                    <div className="space-y-1.5">
                      {scanState.user.team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{member.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {member.roleInTeam}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-muted-foreground">Check-in</span>
                {checkIn === undefined ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant={isCheckedIn ? "default" : "secondary"}>
                    {isCheckedIn ? "Checked In" : "Not Checked In"}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UtensilsCrossed className="size-3.5" />
                  Lunch
                </span>
                {foodDistributions === undefined ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant={lunchReceived ? "default" : "secondary"}>
                    {lunchReceived ? "Received" : "Not Received"}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UtensilsCrossed className="size-3.5" />
                  Snack
                </span>
                {foodDistributions === undefined ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant={snackReceived ? "default" : "secondary"}>
                    {snackReceived ? "Received" : "Not Received"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
