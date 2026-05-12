"use client";

import { useState, useEffect, useMemo } from "react";
import { EventData, categoryEmoji } from "@/lib/data";
import TrendingRail from "@/components/trending-rail";

const DISTRICT_POS: Record<string, { x: number; y: number }> = {
  StareMiasto: { x: 180, y: 220 },
  Jezyce: { x: 90, y: 180 },
  Lazarz: { x: 100, y: 300 },
  Grunwald: { x: 140, y: 380 },
  Wilda: { x: 230, y: 280 },
  Rataje: { x: 270, y: 420 },
  Piatkowo: { x: 200, y: 100 },
  Winogrady: { x: 180, y: 140 },
  NoweMiasto: { x: 290, y: 220 },
  Inny: { x: 180, y: 280 },
};

export default function MapPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selected, setSelected] = useState<EventData | null>(null);
  const [heatOn, setHeatOn] = useState(false);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  const pinPositions = useMemo(() =>
    events.slice(0, 30).map((ev, i) => {
      const base = DISTRICT_POS[ev.district] ?? DISTRICT_POS.Inny;
      const spread = ev.district === "Inny" ? 120 : 28;
      const angle = (i * 137.5) % 360;
      return {
        x: base.x + Math.cos(angle) * (Math.random() * spread),
        y: base.y + Math.sin(angle) * (Math.random() * spread),
      };
    }), [events]);

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ padding: "54px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 16, backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.8)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📍</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Poznań · {events.length} wydarzeń
            </span>
          </div>
          <button onClick={() => setHeatOn(!heatOn)} style={{
            width: 36, height: 36, borderRadius: 99, border: 0,
            background: heatOn ? "var(--hot)" : "var(--bg-soft)",
            color: heatOn ? "white" : "var(--ink-2)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>🔥</button>
        </div>
      </div>

      {/* Map SVG */}
      <div style={{ position: "relative", height: 500, margin: "0 12px", borderRadius: 18, overflow: "hidden", background: "var(--bg-soft)" }}>
        <svg viewBox="0 0 360 640" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
          <path d="M120 640 Q140 500 160 400 Q180 300 150 200 Q130 100 160 0" fill="none" stroke="#7CB8D4" strokeWidth="8" opacity="0.4" />
          <ellipse cx="200" cy="150" rx="50" ry="30" fill="#8FB28E" opacity="0.2" />
          <ellipse cx="80" cy="300" rx="40" ry="25" fill="#8FB28E" opacity="0.2" />
          <ellipse cx="280" cy="450" rx="35" ry="20" fill="#8FB28E" opacity="0.2" />
          <text x="220" y="140" fontSize="9" fontWeight="700" fill="var(--ink-4)">WINOGRADY</text>
          <text x="80" y="180" fontSize="9" fontWeight="700" fill="var(--ink-4)">JEŻYCE</text>
          <text x="180" y="220" fontSize="9" fontWeight="700" fill="var(--ink-4)">STARE MIASTO</text>
          <text x="100" y="300" fontSize="9" fontWeight="700" fill="var(--ink-4)">ŁAZARZ</text>
          <text x="250" y="280" fontSize="9" fontWeight="700" fill="var(--ink-4)">WILDA</text>
          <text x="270" y="420" fontSize="9" fontWeight="700" fill="var(--ink-4)">RATAJE</text>
          <text x="150" y="450" fontSize="9" fontWeight="700" fill="var(--ink-4)">GRUNWALD</text>
          <text x="200" y="100" fontSize="9" fontWeight="700" fill="var(--ink-4)">PIĄTKOWO</text>
          <text x="290" y="180" fontSize="9" fontWeight="700" fill="var(--ink-4)">NOWE MIASTO</text>

          {pinPositions.map((pos, i) => {
            const ev = events[i];
            if (!ev) return null;
            const isSelected = selected?.id === ev.id;
            return (
              <g key={ev.id} onClick={() => setSelected(isSelected ? null : ev)} style={{ cursor: "pointer" }}>
                {heatOn && ev.score > 60 && (
                  <circle cx={pos.x} cy={pos.y} r="28" fill="var(--hot)" opacity="0.15">
                    <animate attributeName="r" values="20;32;20" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={pos.x} cy={pos.y} r={isSelected ? 18 : 12}
                  fill="var(--bg-elev)" stroke={isSelected ? "var(--ink)" : "var(--line-2)"}
                  strokeWidth={isSelected ? 2.5 : 1.5} />
                <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" fontSize="11" fill="var(--ink)">
                  {categoryEmoji[ev.category] ?? "📌"}
                </text>
              </g>
            );
          })}
        </svg>

        {heatOn && (
          <div style={{ position: "absolute", top: 12, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99, background: "var(--hot)", color: "white" }}>
              🔥 Trending
            </span>
          </div>
        )}

        {selected && (
          <div className="pz-pop" style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
            <a href={`/event/${selected.id}`} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 16, background: "var(--bg-elev)", border: "0.5px solid var(--line)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", textDecoration: "none" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--bg-soft)" }}>
                {selected.imageUrl && <img src={selected.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0, lineClamp: 1 }}>{selected.title}</p>
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 0" }}>
                  📍 {selected.placeName} · 🕐 {selected.time ?? ""}
                </p>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Trending rail */}
      {!selected && <TrendingRail />}
    </div>
  );
}
