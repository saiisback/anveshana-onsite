"use client";

import dynamic from "next/dynamic";

const Dither = dynamic(() => import("@/components/Dither"), { ssr: false });

export default function DitherBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div
        className="fixed inset-0 z-0"
        style={{ width: "100vw", height: "100vh" }}
      >
        <Dither
          waveColor={[0.23, 0.72, 0.52]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={2}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
