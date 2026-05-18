"use client";

import { useTilt } from "@/hooks/use-tilt";

export default function TiltCard({ children }: { children: React.ReactNode }) {
  const { ref, style, onMove, onLeave } = useTilt();

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
    >
      {children}
    </div>
  );
}
