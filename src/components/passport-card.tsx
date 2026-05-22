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
      background: "linear-gradient(145deg, #141E30 0%, #1c2d47 30%, #243B55 60%, #152238 100%)",
      color: "white", textAlign: "left",
      boxShadow: "0 4px 16px rgba(20,30,48,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Passport cover texture */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(255,215,0,0.2) 0%, transparent 50%)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <p className="pz-eyebrow" style={{ fontSize: 9, opacity: 0.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Paszport</p>
            <div className="pz-h" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.015em", marginTop: 2, background: "linear-gradient(135deg, #C5A86D, #E8D5A3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              POznaj
            </div>
          </div>
          <PassportIcon size={16} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {["Centrum", "Stare Miasto", "Nowe Miasto", "Jeżyce", "Grunwald", "Wilda"].map((name, i) => {
            const total = 6;
            const unlocked = i < visitedCount;
            return (
              <div key={name} style={{
                aspectRatio: "1", borderRadius: 14,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                background: unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                boxShadow: unlocked ? "inset 0 0 0 1px rgba(255,255,255,0.2)" : "none",
                transition: "all 0.3s var(--ease-out-quart)",
                animation: unlocked ? `pz-stamp-in 0.4s var(--ease-spring) ${i * 0.1}s both` : undefined,
              }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, opacity: unlocked ? 0.85 : 0.25 }}>
                  {name.substring(0, 3)}
                </span>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: unlocked ? "rgba(197,168,109,0.6)" : "rgba(255,255,255,0.08)",
                  marginTop: 2,
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, opacity: 0.35, marginTop: 8 }}>{visitedCount}/6 dzielnic</div>
      </div>
    </button>
  );
}
