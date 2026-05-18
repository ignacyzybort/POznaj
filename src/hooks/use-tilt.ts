"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_TILT = 12;
const SPRING_DURATION = "0.5s var(--ease-spring)";

export function useTilt() {
  const [disabled, setDisabled] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  // Cache rect with ResizeObserver; disable on touch-only devices
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqHover = window.matchMedia("(hover: hover)");
    setDisabled(mqMotion.matches || !mqHover.matches);

    const onMotionChange = (e: MediaQueryListEvent) => setDisabled(e.matches || !mqHover.matches);
    const onHoverChange = (e: MediaQueryListEvent) => setDisabled(mqMotion.matches || !e.matches);
    mqMotion.addEventListener("change", onMotionChange);
    mqHover.addEventListener("change", onHoverChange);

    const el = ref.current;
    if (el) {
      rectRef.current = el.getBoundingClientRect();
      const ro = new ResizeObserver(() => {
        rectRef.current = el.getBoundingClientRect();
      });
      ro.observe(el);
      return () => {
        mqMotion.removeEventListener("change", onMotionChange);
        mqHover.removeEventListener("change", onHoverChange);
        ro.disconnect();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    return () => {
      mqMotion.removeEventListener("change", onMotionChange);
      mqHover.removeEventListener("change", onHoverChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || !rectRef.current) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = rectRef.current!;
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
    });
  }, [disabled]);

  const onLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
