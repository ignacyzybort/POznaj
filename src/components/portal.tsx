"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders overlay children into document.body so they are not trapped inside
 * a scrolling / transformed ancestor (which broke fixed positioning of dialogs).
 * SSR-safe: renders nothing until mounted.
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
