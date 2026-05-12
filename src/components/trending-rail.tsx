"use client";

import { useState, useEffect } from "react";

interface TrendVenue {
  name: string;
  score: number;
  count: number;
}

export default function TrendingRail() {
  const [venues, setVenues] = useState<TrendVenue[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=50").then((r) => r.json()).then((d) => {
      const evs = d.events ?? [];
      const groups: Record<string, { score: number; count: number }> = {};
      for (const e of evs) {
        const key = e.placeName;
        if (!groups[key]) groups[key] = { score: 0, count: 0 };
        groups[key].score += e.score;
        groups[key].count += 1;
      }
      const sorted = Object.entries(groups)
        .map(([name, v]) => ({ name, score: Math.round(v.score / v.count), count: v.count }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      setVenues(sorted);
    }).catch(() => {});
  }, []);

  if (venues.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 10px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 className="pz-h" style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>🔥 Hottest venues</h2>
        <span className="pz-eyebrow">Top w tym tygodniu</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {venues.map((v, i) => (
          <div key={v.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 14, background: "var(--bg-soft)" }}>
            <span className="pz-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-4)", minWidth: 20 }}>#{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{v.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{v.count} wydarzeń</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="pz-heat-bar" style={{ width: 3, height: 14, background: "var(--hot)", borderRadius: 2, animation: "pz-pulse 1.4s infinite", animationDelay: `${i * 0.1}s` }} />
              <span className="pz-num" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)" }}>{v.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
