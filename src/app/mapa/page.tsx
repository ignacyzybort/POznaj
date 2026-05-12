"use client";

import { useState, useEffect } from "react";
import { EventData, categoryEmoji } from "@/lib/data";
import Link from "next/link";
import TrendingRail from "@/components/trending-rail";

export default function MapPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selected, setSelected] = useState<EventData | null>(null);
  const [heatOn, setHeatOn] = useState(false);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--bg)", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "48px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 16, backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.8)" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Poznań · {events.length} wydarzeń
            </span>
          </div>
          <button
            onClick={() => setHeatOn(!heatOn)}
            style={{
              width: 36, height: 36, borderRadius: 99, border: 0,
              background: heatOn ? "var(--hot)" : "var(--bg-soft)",
              color: heatOn ? "white" : "var(--ink-2)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}
          >
            🔥
          </button>
        </div>
      </div>

      {/* SVG Map */}
      <svg viewBox="0 0 360 640" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "var(--bg-soft)" }}>
        {/* Warta river */}
        <path d="M120 640 Q140 500 160 400 Q180 300 150 200 Q130 100 160 0" fill="none" stroke="#7CB8D4" strokeWidth="8" opacity="0.4" />

        {/* Parks */}
        <ellipse cx="200" cy="150" rx="50" ry="30" fill="#8FB28E" opacity="0.2" />
        <ellipse cx="80" cy="300" rx="40" ry="25" fill="#8FB28E" opacity="0.2" />
        <ellipse cx="280" cy="450" rx="35" ry="20" fill="#8FB28E" opacity="0.2" />

        {/* District labels */}
        <text x="220" y="140" fontSize="9" fontWeight="700" fill="var(--ink-4)">WIN OGRADY</text>
        <text x="80" y="180" fontSize="9" fontWeight="700" fill="var(--ink-4)">JEŻYCE</text>
        <text x="180" y="220" fontSize="9" fontWeight="700" fill="var(--ink-4)">STARE MIASTO</text>
        <text x="100" y="300" fontSize="9" fontWeight="700" fill="var(--ink-4)">ŁAZARZ</text>
        <text x="250" y="280" fontSize="9" fontWeight="700" fill="var(--ink-4)">WILDA</text>
        <text x="270" y="420" fontSize="9" fontWeight="700" fill="var(--ink-4)">RATAJE</text>
        <text x="150" y="450" fontSize="9" fontWeight="700" fill="var(--ink-4)">GRUNWALD</text>
        <text x="200" y="100" fontSize="9" fontWeight="700" fill="var(--ink-4)">PIĄTKOWO</text>
        <text x="290" y="180" fontSize="9" fontWeight="700" fill="var(--ink-4)">NOWE MIASTO</text>

        {/* Event pins */}
        {events.slice(0, 20).map((ev, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const cx = 180 + Math.cos(angle) * 80 + (Math.random() - 0.5) * 20;
          const cy = 280 + Math.sin(angle) * 80 + (Math.random() - 0.5) * 20;
          const isSelected = selected?.id === ev.id;
          return (
            <g key={ev.id} onClick={() => setSelected(isSelected ? null : ev)} style={{ cursor: "pointer" }}>
              {heatOn && ev.score > 60 && (
                <circle cx={cx} cy={cy} r="28" fill="var(--hot)" opacity="0.15">
                  <animate attributeName="r" values="20;32;20" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={cx} cy={cy} r={isSelected ? 18 : 12}
                fill="var(--bg-elev)"
                stroke={isSelected ? "var(--ink)" : "var(--line-2)"}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text x={cx} y={cy + 0.5} textAnchor="middle" fontSize="11" fill="var(--ink)">
                {categoryEmoji[ev.category] ?? "📌"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected event mini card */}
      {selected && (
        <div className="pz-pop" style={{ position: "absolute", bottom: 100, left: 12, right: 12, zIndex: 20 }}>
          <Link href={`/event/${selected.id}`} className="flex gap-3 p-3 rounded-2xl no-underline" style={{ background: "var(--bg-elev)", border: "0.5px solid var(--line)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-soft)]">
              {selected.imageUrl && <img src={selected.imageUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold line-clamp-1" style={{ color: "var(--ink)" }}>{selected.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                📍 {selected.placeName} · 🕐 {selected.time ?? ""}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--bg-soft)", color: "var(--ink-3)" }}>
                {categoryEmoji[selected.category]} {selected.category}
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Heat toggle label */}
      {heatOn && (
        <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99, background: "var(--hot)", color: "white" }}>
            🔥 Najpopularniejsze miejsca
          </span>
        </div>
      )}

      {/* Trending venues rail — only when nothing selected */}
      {!selected && (
        <div style={{ position: "absolute", bottom: 80, left: 0, right: 0 }}>
          <TrendingRail />
        </div>
      )}
    </div>
  );
}
