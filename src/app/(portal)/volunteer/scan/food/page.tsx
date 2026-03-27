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
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
  RotateCcw,
  UtensilsCrossed,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const QR_PREFIX_USER = "anveshana-user-";
const QR_PREFIX_TEAM = "anveshana-team-";

type MealType = "Lunch" | "Snack";

type ScanState =
  | { step: "scanning" }
  | { step: "validating"; visitorId: string }
  | {
      step: "confirming";
      visitorId: string;
      visitorName: string;
      visitorEmail: string;
      visitorRole: string;
      teamName: string | null;
      teamStall: number | null;
      alreadyServed: boolean;
    }
  | { step: "distributing"; visitorId: string; visitorName: string }
  | { step: "success"; visitorName: string }
  | { step: "error"; message: string };

const MEAL_OPTIONS: MealType[] = ["Lunch", "Snack"];

export default function FoodScannerPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const volunteerId = session?.user?.id ?? "";
  const volunteerName = session?.user?.name ?? "";

  const [scanState, setScanState] = useState<ScanState>({ step: "scanning" });
  const [selectedMeal, setSelectedMeal] = useState<MealType>("Lunch");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentVisitorId, setCurrentVisitorId] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const processingRef = useRef(false);
  const scannerDivId = "qr-reader-food";

  const createDistribution = useMutation(api.foodDistributions.create);
  const existingDistributions = useQuery(
    api.foodDistributions.getByVisitorAndMeal,
    currentVisitorId ? { visitorId: currentVisitorId, mealType: selectedMeal } : "skip"
  );
  const recentDistributions = useQuery(api.foodDistributions.listRecent, {});
  const stats = useQuery(api.foodDistributions.getStats, {});

  const resetScanner = useCallback(() => {
    processingRef.current = false;
    setScanState({ step: "scanning" });
    setCurrentVisitorId(null);
    setCameraError(null);
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch {
        // Scanner may not be paused
      }
    }
  }, []);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      // Prevent multiple simultaneous scan processing
      if (processingRef.current) return;
      processingRef.current = true;

      let userId: string | null = null;

      // Check for user QR code format
      if (decodedText.startsWith(QR_PREFIX_USER)) {
        userId = decodedText.slice(QR_PREFIX_USER.length);
      } else if (decodedText.startsWith(QR_PREFIX_TEAM)) {
        // Legacy team QR - not supported for food distribution
        setScanState({
          step: "error",
          message: "Please scan a personal QR code, not a team QR code",
        });
        processingRef.current = false;
        return;
      } else {
        setScanState({
          step: "error",
          message: "Not a valid Anveshana QR code",
        });
        processingRef.current = false;
        return;
      }

      if (!userId) {
        setScanState({
          step: "error",
          message: "Invalid QR code: no user ID found",
        });
        processingRef.current = false;
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

      setScanState({ step: "validating", visitorId: userId });
      setCurrentVisitorId(userId);

      try {
        const res = await fetch(
          `/api/admin/users/validate?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setScanState({
            step: "error",
            message:
              res.status === 404
                ? "User not found"
                : (data.error ?? "Failed to validate user"),
          });
          return;
        }

        const user = await res.json();

        setScanState({
          step: "confirming",
          visitorId: user.id,
          visitorName: user.name,
          visitorEmail: user.email,
          visitorRole: user.role,
          teamName: user.team?.name ?? null,
          teamStall: user.team?.stallNumber ?? null,
          alreadyServed: false, // Will be updated by useEffect
        });
      } catch {
        setScanState({
          step: "error",
          message: "Network error. Please try again.",
        });
      }
    },
    []
  );

  // Update alreadyServed when existingDistributions query resolves
  useEffect(() => {
    if (
      scanState.step === "confirming" &&
      existingDistributions !== undefined
    ) {
      setScanState((prev) =>
        prev.step === "confirming"
          ? { ...prev, alreadyServed: existingDistributions.length > 0 }
          : prev
      );
    }
  }, [existingDistributions, scanState.step]);

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

  const handleConfirmDistribution = async () => {
    if (scanState.step !== "confirming") return;

    const { visitorId, visitorName, teamName } = scanState;
    setScanState({ step: "distributing", visitorId, visitorName });

    try {
      await createDistribution({
        visitorId,
        visitorName,
        teamName: teamName ?? undefined,
        distributedBy: volunteerId,
        distributedByName: volunteerName,
        mealType: selectedMeal,
      });
      setScanState({ step: "success", visitorName });
      toast.success(`${selectedMeal} distributed to "${visitorName}"!`);

      // Auto-reset after 2 seconds
      setTimeout(() => {
        resetScanner();
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to record distribution";
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
          Food Distribution
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan a participant&apos;s personal QR code to record meal distribution.
        </p>
      </div>

      {/* Meal Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4" />
            Select Meal Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {MEAL_OPTIONS.map((meal) => (
              <Button
                key={meal}
                variant={selectedMeal === meal ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMeal(meal)}
                disabled={scanState.step !== "scanning"}
              >
                {meal}
                {stats && (
                  <Badge variant="secondary" className="ml-1.5">
                    {stats[meal]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          {stats && (
            <p className="mt-2 text-xs text-muted-foreground">
              Total distributions: {stats.total}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Camera Error */}
      {cameraError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-medium">{cameraError}</p>
              <p className="text-xs text-muted-foreground">
                Make sure you have allowed camera access in your browser
                settings.
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
              <span className="text-sm text-muted-foreground">
                Validating participant...
              </span>
            </div>
          )}

          {/* Confirmation */}
          {scanState.step === "confirming" && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Distribute {selectedMeal} to:
                </p>
                <p className="text-lg font-semibold">{scanState.visitorName}</p>
                {scanState.teamName && (
                  <Badge variant="outline" className="mt-1">
                    {scanState.teamName}
                  </Badge>
                )}
              </div>

              {scanState.alreadyServed && (
                <div className="mx-auto flex max-w-xs items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                  <AlertTriangle className="size-5 text-yellow-500" />
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This person has already received {selectedMeal} today.
                  </p>
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
                        <span className="text-sm text-muted-foreground">{selectedMeal} Status</span>
                        <Badge variant={scanState.alreadyServed ? "default" : "secondary"}>
                          {scanState.alreadyServed ? "Already Received" : "Not Received"}
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
                <Button
                  onClick={handleConfirmDistribution}
                  disabled={scanState.alreadyServed}
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Confirm
                </Button>
              </div>
            </div>
          )}

          {/* Distributing */}
          {scanState.step === "distributing" && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Recording distribution for {scanState.visitorName}...
              </span>
            </div>
          )}

          {/* Success */}
          {scanState.step === "success" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="size-8 text-green-500" />
              <p className="text-sm font-medium">
                {selectedMeal} distributed to {scanState.visitorName}!
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

      {/* Recent Distributions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Distributions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDistributions === undefined && (
            <p className="text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}
          {recentDistributions?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No distributions yet.
            </p>
          )}
          {recentDistributions && recentDistributions.length > 0 && (
            <div className="space-y-2">
              {recentDistributions.slice(0, 10).map((dist) => (
                <div
                  key={dist._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {dist.mealType}
                    </Badge>
                    <span className="font-medium">{dist.visitorName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(dist._creationTime).toLocaleTimeString()}
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
