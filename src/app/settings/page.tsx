"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { districts, categories, vibes } from "@/lib/filters";
import { categoryVisual } from "@/lib/visuals";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      <div style={{ padding: "54px 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: 99, border: 0,
          background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <BackIcon size={20} />
        </button>
        <div>
          <div className="pz-eyebrow">Ustawienia</div>
          <div className="pz-h" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>Preferencje</div>
        </div>
      </div>

      <div style={{ padding: "6px 18px 30px" }}>
        {/* Dark mode toggle */}
        <div className="pz-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="pz-h" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>🎨 Tryb ciemny</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{theme === "dark" ? "Włączony" : "Wyłączony"}</div>
            </div>
            <button onClick={toggleTheme} style={{
              position: "relative", width: 48, height: 28, borderRadius: 99, border: 0, cursor: "pointer",
              background: theme === "dark" ? "var(--sage)" : "var(--line-2)", transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 2, width: 24, height: 24, borderRadius: 99,
                background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
                left: theme === "dark" ? 22 : 2,
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
