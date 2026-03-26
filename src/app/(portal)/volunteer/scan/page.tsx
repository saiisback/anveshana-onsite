"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Camera, RotateCcw, AlertTriangle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const USER_QR_PREFIX = "anveshana-user-";

type ScanState =
  | { step: "scanning" }
  | { step: "validating"; visitorId: string }
  | { step: "confirming"; visitorId: string; visitorName: string; visitorEmail: string; visitorRole: string; teamName: string | null; teamStall: number | null; alreadyCheckedIn: boolean }
  | { step: "checking-in"; visitorId: string; visitorName: string }
  | { step: "success"; visitorName: string }
  | { step: "error"; message: string };

export default function VolunteerScanPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const volunteerId = session?.user?.id ?? "";
  const volunteerName = session?.user?.name ?? "";

  const [scanState, setScanState] = useState<ScanState>({ step: "scanning" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "qr-reader";

  const createCheckIn = useMutation(api.checkIns.create);
  const recentCheckIns = useQuery(api.checkIns.list, {});
  const existingCheckIn = useQuery(
    api.checkIns.getByVisitor,
    scanState.step === "validating" || scanState.step === "confirming"
      ? { visitorId: scanState.visitorId }
      : "skip"
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

    const visitorId = decodedText.slice(USER_QR_PREFIX.length);
    if (!visitorId) {
      setScanState({ step: "error", message: "Invalid QR code: no user ID found" });
      return;
    }

    // Pause scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.pause(true);
      } catch {
        // Scanner may not support pause
      }
    }

    setScanState({ step: "validating", visitorId });

    try {
      const res = await fetch(`/api/admin/users/validate?userId=${encodeURIComponent(visitorId)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScanState({
          step: "error",
          message: res.status === 404 ? "User not found" : (data.error ?? "Failed to validate user"),
        });
        return;
      }

      const user = await res.json();
      
      // Check if already checked in (via API or convex)
      const checkRes = await fetch(`/api/admin/users/check-in-status?userId=${encodeURIComponent(visitorId)}`);
      const alreadyCheckedIn = checkRes.ok ? (await checkRes.json()).checkedIn : false;

      setScanState({
        step: "confirming",
        visitorId: user.id,
        visitorName: user.name,
        visitorEmail: user.email,
        visitorRole: user.role,
        teamName: user.team?.name ?? null,
        teamStall: user.team?.stallNumber ?? null,
        alreadyCheckedIn,
      });
    } catch {
      setScanState({ step: "error", message: "Network error. Please try again." });
    }
  }, []);

  const handleScanError = useCallback((_errorMessage: string) => {
    // html5-qrcode fires this continuously when no QR is in frame — ignore it
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

  const handleConfirmCheckIn = async () => {
    if (scanState.step !== "confirming") return;

    const { visitorId, visitorName, teamName } = scanState;
    setScanState({ step: "checking-in", visitorId, visitorName });

    try {
      await createCheckIn({
        visitorId,
        visitorName,
        teamName: teamName ?? undefined,
        checkedInBy: volunteerId,
        checkedInByName: volunteerName,
      });
      setScanState({ step: "success", visitorName });
      toast.success(`${visitorName} checked in successfully!`);

      // Auto-reset after 2 seconds
      setTimeout(() => {
        resetScanner();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check in";
      setScanState({ step: "error", message });
      toast.error(message);
    }
  };

  const handleCancel = () => {
    resetScanner();
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
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm text-muted-foreground">
          Unable to load session. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Check-in Scanner
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan a participant&apos;s QR code to check them in.
        </p>
      </div>

      {/* Camera Error */}
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

          {/* Validating */}
          {scanState.step === "validating" && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Validating participant...</span>
            </div>
          )}

          {/* Confirmation */}
          {scanState.step === "confirming" && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Check in participant:</p>
                <p className="text-lg font-semibold">{scanState.visitorName}</p>
                {scanState.teamName && (
                  <Badge variant="outline" className="mt-1">
                    {scanState.teamName}
                  </Badge>
                )}
              </div>
              
              {scanState.alreadyCheckedIn && (
                <div className="flex items-center justify-center gap-2 rounded-md bg-yellow-500/10 px-3 py-2 text-yellow-600">
                  <AlertTriangle className="size-4" />
                  <span className="text-sm font-medium">Already checked in</span>
                </div>
              )}

              {/* See Info Dialog */}
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <Info className="size-4" />
                        See Full Info
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Participant Info</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{scanState.visitorName}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="text-sm font-medium">{scanState.visitorEmail}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant="secondary">{scanState.visitorRole}</Badge>
                      </div>
                      {scanState.teamName && (
                        <>
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Team</span>
                            <span className="text-sm font-medium">{scanState.teamName}</span>
                          </div>
                          {scanState.teamStall && (
                            <div className="flex justify-between border-b pb-2">
                              <span className="text-sm text-muted-foreground">Stall Number</span>
                              <Badge variant="outline">#{scanState.teamStall}</Badge>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Check-in Status</span>
                        <Badge variant={scanState.alreadyCheckedIn ? "default" : "secondary"}>
                          {scanState.alreadyCheckedIn ? "Already Checked In" : "Not Checked In"}
                        </Badge>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmCheckIn} disabled={scanState.alreadyCheckedIn}>
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Confirm Check-in
                </Button>
              </div>
            </div>
          )}

          {/* Checking in */}
          {scanState.step === "checking-in" && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Checking in {scanState.visitorName}...
              </span>
            </div>
          )}

          {/* Success */}
          {scanState.step === "success" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="size-8 text-green-500" />
              <p className="text-sm font-medium">
                {scanState.visitorName} checked in!
              </p>
              <p className="text-xs text-muted-foreground">
                Resetting scanner...
              </p>
            </div>
          )}

          {/* Error */}
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
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckIns === undefined && (
            <p className="text-center text-sm text-muted-foreground">Loading...</p>
          )}
          {recentCheckIns?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No check-ins yet.
            </p>
          )}
          {recentCheckIns && recentCheckIns.length > 0 && (
            <div className="space-y-2">
              {recentCheckIns.slice(0, 10).map((checkIn) => (
                <div
                  key={checkIn._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{checkIn.visitorName}</span>
                    {checkIn.teamName && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({checkIn.teamName})
                      </span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground">
                      by {checkIn.checkedInByName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(checkIn._creationTime).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
