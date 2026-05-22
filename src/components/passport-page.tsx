"use client";

import type { DistrictVisit } from "@/components/passport-booklet";

export default function PassportPage({
  isFirst, spread, visits,
}: {
  isFirst: boolean;
  spread: number;
  visits: DistrictVisit[];
}) {
  if (isFirst) {
    const visitedCount = visits.filter((v) => v.count > 0).length;
    const totalEvents = visits.reduce((s, v) => s + v.count, 0);
    const first = visits.filter((v) => v.count > 0).sort((a, b) => a.events[0].date.localeCompare(b.events[0].date))[0];
    return (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.3)", marginBottom: 8 }}>Paszport</div>
          <span style={{ fontSize: "clamp(40px, 12vw, 64px)", fontWeight: 800 }}>{visitedCount}<span style={{ fontSize: "0.35em", opacity: 0.3, marginLeft: 2 }}>/6</span></span>
          <div style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", marginTop: 2 }}>dzielnic</div>
          <div style={{ fontSize: 8, color: "rgba(0,0,0,0.2)", marginTop: 10 }}>{totalEvents} wydarzeń</div>
          {first && (
            <div style={{ fontSize: 8, color: "rgba(0,0,0,0.18)", marginTop: 4 }}>
              od {first.events[0].date}
            </div>
          )}
        </div>
        <div style={{ width: 1, background: "rgba(0,0,0,0.06)" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(0,0,0,0.3)", marginBottom: 6 }}>
            {new Date().getFullYear()}
          </div>
          <span style={{ fontSize: "clamp(32px, 10vw, 52px)", fontWeight: 800 }}>{totalEvents}</span>
          <div style={{ fontSize: 10, color: "rgba(0,0,0,0.35)", marginTop: 2 }}>wydarzeń</div>
        </div>
      </div>
    );
  }

  const v = visits[spread - 1];
  if (!v) return null;

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Left: stamp */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
          Dzielnica
        </div>
        <span style={{ fontSize: "clamp(12px, 3.5vw, 17px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 10 }}>
          {v.label}
        </span>
        {v.count > 0 ? (
          <div style={{
            width: 88, height: 54, borderRadius: "50%",
            border: "2px solid rgba(28,45,65,0.35)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            transform: "rotate(-6deg)",
            opacity: 0.75,
            color: "#1C2D41",
            animation: "pz-stamp-in 0.55s var(--ease-out-quart) both",
          }}>
            <span style={{ fontSize: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6 }}>
              POznaj
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", marginTop: 1 }}>
              {v.label.substring(0, 8)}
            </span>
            <span style={{ fontSize: 6, fontFamily: "var(--font-mono)", opacity: 0.5, marginTop: 2 }}>
              {v.events[0]?.date}
            </span>
          </div>
        ) : (
          <div style={{ opacity: 0.12, fontSize: 10, marginTop: 8 }}>—</div>
        )}
      </div>

      {/* Center fold */}
      <div style={{ width: 1, background: "rgba(0,0,0,0.06)" }} />

      {/* Right: visits / events */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12 }}>
        {v.count > 0 ? (
          <>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
              Wizyty
            </div>
            <span style={{ fontSize: "clamp(20px, 6vw, 32px)", fontWeight: 800 }}>
              {v.count}
            </span>
            <div style={{ fontSize: 8, color: "rgba(0,0,0,0.3)", marginTop: 1 }}>
              {v.count === 1 ? "wizyta" : v.count < 5 ? "wizyty" : "wizyt"}
            </div>
            <div style={{ marginTop: 8, fontSize: 7, color: "rgba(0,0,0,0.25)", lineHeight: 1.6, maxWidth: "100%", overflow: "hidden" }}>
              {v.events.slice(0, 3).map((ev, i) => (
                <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ev.date} — {ev.title.substring(0, 20)}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.12, fontSize: 8, textAlign: "center" }}>
            Jeszcze<br />nieodwiedzona
          </div>
        )}
      </div>
    </div>
  );
}
