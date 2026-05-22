"use client";

export default function PassportCover({ userName, onOpen }: { userName: string; onOpen: () => void }) {
  return (
    <div onClick={onOpen} style={{
      width: "100%", height: "100%", cursor: "pointer",
      background: "#5C0A1E",
      borderRadius: "4px 16px 16px 4px",
      border: "1.5px solid rgba(197,168,109,0.5)",
      boxShadow: "0 2px 0 rgba(0,0,0,0.3), 0 4px 0 rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      animation: "pz-cover-in 0.5s var(--ease-spring) both",
    }}>
      {/* Grain texture overlay */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />

      {/* Spine (left edge) */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 16,
        background: "linear-gradient(90deg, #3A0612 0%, #4A0818 40%, #5C0A1E 100%)",
        borderRadius: "4px 0 0 4px",
        borderRight: "1px solid rgba(197,168,109,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        writingMode: "vertical-rl" as any,
        fontSize: 7, fontWeight: 700, letterSpacing: "0.08em",
        color: "rgba(197,168,109,0.35)",
        padding: "8px 0",
      }}>
        POZNAJ
      </div>

      {/* Gold emblem circle */}
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        border: "2px solid rgba(197,168,109,0.45)",
        marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle, rgba(197,168,109,0.08) 0%, transparent 70%)",
        position: "relative", zIndex: 1,
      }}>
        <span style={{ fontSize: 42 }}>🏛️</span>
      </div>

      {/* Gold text */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "rgba(197,168,109,0.6)", textTransform: "uppercase",
        marginBottom: 10, position: "relative", zIndex: 1,
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}>
        Paszport
      </div>
      <div className="pz-h" style={{
        fontSize: "clamp(26px, 7vw, 36px)", fontWeight: 800,
        letterSpacing: "-0.02em",
        background: "linear-gradient(180deg, #D4B87A 0%, #A88B4A 50%, #C5A86D 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
        marginBottom: 32, position: "relative", zIndex: 1,
      }}>
        POznaj
      </div>

      {/* User name + year */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{
          fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.05em",
        }}>
          {userName}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, color: "rgba(197,168,109,0.3)",
          letterSpacing: "0.1em", marginTop: 6,
        }}>
          {new Date().getFullYear()}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: "absolute", bottom: 20, fontSize: 10,
        color: "rgba(255,255,255,0.18)", letterSpacing: "0.04em",
        pointerEvents: "none", zIndex: 1,
      }}>
        Tapnij, aby otworzyć
      </div>
    </div>
  );
}
