"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_TILT = 12;
const SPRING_DURATION = "0.5s var(--ease-spring)";

export function useTilt() {
  const [disabled, setDisabled] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setDisabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDisabled(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const cx = (clientX - rect.left) / rect.width - 0.5;
    const cy = (clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: Math.round(-cy * MAX_TILT * 10) / 10,
      y: Math.round(cx * MAX_TILT * 10) / 10,
      active: true,
    });
  }, []);

  const onLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, active: false });
  }, []);

  const style = tilt.active
    ? {
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(6px)`,
        transition: "transform 0.1s ease-out",
      }
    : {
        transform: "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)",
        transition: `transform ${SPRING_DURATION}`,
      };

  return { ref, style, onMove, onLeave, tilt };
}
