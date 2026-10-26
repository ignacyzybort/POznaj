"use client";

export default function PassportCard({
  visitedCount, onClick,
}: {
  visitedCount: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      padding: 0, borderRadius: 22, border: "none", cursor: "pointer",
      color: "white", textAlign: "center",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
    }}>
      {/* Outer shadow (book depth) */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 22,
        boxShadow: "0 2px 0 #3A0612, 0 4px 0 #2D050E, 0 6px 16px rgba(0,0,0,0.35)",
      }} />

      {/* Burgundy background */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 22,
        background: "linear-gradient(145deg, #4E0A1C 0%, #5C0A1E 30%, #6B0C23 55%, #4E0A1C 100%)",
        border: "1.5px solid rgba(197,168,109,0.3)",
      }} />

      {/* Grain texture */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, opacity: 0.05,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        backgroundSize: "200px 200px",
      }} />

      {/* Spine (left) */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 14,
        background: "linear-gradient(90deg, #2D050E 0%, #3A0612 50%, #4E0A1C 100%)",
        borderRight: "1px solid rgba(197,168,109,0.15)",
        borderRadius: "22px 0 0 22px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          writingMode: "vertical-rl" as any, fontSize: 6, fontWeight: 700,
          letterSpacing: "0.06em", color: "rgba(197,168,109,0.3)",
          padding: "4px 2px",
        }}>
          POZNAJ
        </span>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "14px 12px 12px 26px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Emblem */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1.5px solid rgba(197,168,109,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 8, fontSize: 18,
          background: "radial-gradient(circle, rgba(197,168,109,0.1), transparent 70%)",
        }}>
          <span className="pz-display" style={{ fontSize: 22, lineHeight: 0.8 }}>P.</span>
        </div>

        {/* Gold text */}
        <div style={{
          fontSize: 7, fontWeight: 700, letterSpacing: "0.18em",
          color: "rgba(197,168,109,0.55)", textTransform: "uppercase",
          marginBottom: 2, textShadow: "0 1px 1px rgba(0,0,0,0.4)",
        }}>
          Paszport
        </div>
        <div className="pz-h" style={{
          fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 800, letterSpacing: "-0.015em",
          background: "linear-gradient(180deg, #D4B87A 0%, #A88B4A 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
          marginBottom: 10,
        }}>
          POznaj
        </div>

        {/* District dots */}
        <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: "50%",
              background: i < visitedCount ? "rgba(197,168,109,0.7)" : "transparent",
              border: `1px solid ${i < visitedCount ? "rgba(197,168,109,0.6)" : "rgba(255,255,255,0.12)"}`,
              animation: i < visitedCount ? `pz-stamp-in 0.35s var(--ease-spring) ${i * 0.1}s both` : undefined,
              boxShadow: i < visitedCount ? "inset 0 1px 2px rgba(0,0,0,0.2)" : "none",
            }} />
          ))}
        </div>

        <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.22)" }}>
          {visitedCount}/6
        </div>
      </div>
    </button>
  );
}
