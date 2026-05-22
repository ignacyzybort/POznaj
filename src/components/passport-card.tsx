"use client";

import { PassportIcon } from "@/components/icons";

export default function PassportCard({
  visitedCount, onClick,
}: {
  visitedCount: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      padding: 16, borderRadius: 22, border: "none", cursor: "pointer",
      background: "linear-gradient(145deg, #3D0C1A 0%, #4A0B23 30%, #5C0F2B 60%, #3D0C1A 100%)",
      color: "white", textAlign: "left",
      boxShadow: "0 4px 20px rgba(61,12,26,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle texture lines */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)" }} />
      {/* Spine accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: "linear-gradient(90deg, rgba(0,0,0,0.4), transparent)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 700, opacity: 0.4, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Paszport
            </div>
            <div className="pz-h" style={{
              fontSize: 15, fontWeight: 800, letterSpacing: "-0.015em", marginTop: 2,
              background: "linear-gradient(135deg, #C5A86D, #E8D5A3, #C5A86D)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              POznaj
            </div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid rgba(197,168,109,0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🏛️
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
          {["Centrum", "Stare Miasto", "Nowe Miasto", "Jeżyce", "Grunwald", "Wilda"].map((name, i) => (
            <div key={name} style={{
              aspectRatio: "1.5", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: i < visitedCount ? "rgba(197,168,109,0.15)" : "rgba(255,255,255,0.03)",
              border: i < visitedCount ? "0.5px solid rgba(197,168,109,0.3)" : "0.5px solid rgba(255,255,255,0.06)",
              fontSize: 9, fontWeight: 600, color: i < visitedCount ? "rgba(197,168,109,0.8)" : "rgba(255,255,255,0.15)",
              animation: i < visitedCount ? `pz-stamp-in 0.3s var(--ease-spring) ${i * 0.08}s both` : undefined,
            }}>
              {name.substring(0, 3)}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>{visitedCount}/6 dzielnic</div>
      </div>
    </button>
  );
}
