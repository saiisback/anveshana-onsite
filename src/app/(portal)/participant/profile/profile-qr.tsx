"use client";

import { useRef } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ProfileQRCodeProps {
  value: string;
  userName: string;
}

export function ProfileQRCode({ value, userName }: ProfileQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("QR generation error:", error);
          setLoading(false);
        }
      );
    }
  }, [value]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `${userName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-4">
        <canvas
          ref={canvasRef}
          className={loading ? "opacity-0" : "opacity-100"}
        />
      </div>
      <div className="text-center">
        <p className="font-medium">{userName}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="mr-1.5 size-4" />
        Download QR
      </Button>
    </div>
  );
}
