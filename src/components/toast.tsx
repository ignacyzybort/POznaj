"use client";

import { useEffect } from "react";

export default function Toast({ msg, onClear }: { msg: string | null; onClear: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClear, 1900);
    return () => clearTimeout(t);
  }, [msg, onClear]);

  if (!msg) return null;
  return (
    <div className="pz-toast-enter" style={{
      animation: "pz-toast-enter 0.4s var(--ease-spring) both",
      position: "fixed", left: "50%", bottom: 96,
      transform: "translateX(-50%)", zIndex: 80,
      background: "var(--ink)", color: "var(--bg)",
      padding: "12px 18px", borderRadius: 99,
      fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    }}>{msg}</div>
  );
}
