"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="dialog"]';

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    prevRef.current = document.activeElement as HTMLElement;

    const el = ref.current;
    if (!el) return;

    requestAnimationFrame(() => {
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const idx = focusable.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx <= 0) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
      } else {
        if (idx >= focusable.length - 1) { e.preventDefault(); focusable[0].focus(); }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevRef.current && typeof prevRef.current.focus === "function") {
        prevRef.current.focus();
      }
    };
  }, [active]);

  return ref;
}
