"use client";

import { useTilt } from "@/hooks/use-tilt";

export default function TiltCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { ref, style, onMove, onLeave } = useTilt();

  const handleClick = () => {
    onLeave(); // Reset tilt before navigation to prevent shared transition conflict
    onClick?.();
  };

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onTouchMove={onMove}
      onTouchEnd={onLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
