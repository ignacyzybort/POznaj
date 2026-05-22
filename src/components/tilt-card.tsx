"use client";

import { useTilt } from "@/hooks/use-tilt";

export default function TiltCard({ children, maxTilt }: { children: React.ReactNode; maxTilt?: number }) {
  const { ref, style, onMove, onLeave } = useTilt(maxTilt);

  return (
    <div
      ref={ref}
      style={{ ...style, height: "100%" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
    >
      {children}
    </div>
  );
}
