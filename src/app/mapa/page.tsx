"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { EventData } from "@/lib/data";
import { DISTRICT_SHAPES } from "@/lib/district-shapes";

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), { ssr: false });

type MapMode = "overview" | "exploring" | "leaflet";

export default function MapPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [mode, setMode] = useState<MapMode>("overview");
  const [selected, setSelected] = useState<string | null>(null);
  const [exitPhase, setExitPhase] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/events?limit=200").then((r) => r.json()).then((d) => {
      const evs = d.events ?? [];
      setEvents(evs);
      const c: Record<string, number> = {};
      for (const e of evs) {
        c[e.district] = (c[e.district] || 0) + 1;
      }
      setCounts(c);
      const vals = Object.values(c);
      const max = Math.max(...vals, 1);
      const result: Record<string, string> = {};
      const districtHues: Record<string, number> = {
        StareMiasto: 340, Jezyce: 35, Lazarz: 200, Grunwald: 120,
        Wilda: 280, Rataje: 160, Piatkowo: 50, Winogrady: 10,
        NoweMiasto: 220, Inny: 0,
      };
      for (const [k, v] of Object.entries(c)) {
        const ratio = v / max;
        const baseHue = districtHues[k] ?? 0;
        const sat = 55 + Math.round(20 * ratio);
        const lit = 45 - Math.round(15 * ratio);
        result[k] = `hsl(${baseHue}, ${sat}%, ${lit}%)`;
      }
      for (const s of DISTRICT_SHAPES) {
        if (!result[s.id]) result[s.id] = "hsl(0, 0%, 92%)";
      }
      setColors(result);
    });
  }, []);

  const selectDistrict = useCallback((id: string) => {
    setSelected(id);
    setExitPhase(true);
    setTimeout(() => {
      setMode("leaflet");
    }, 420);
  }, []);

  const backToOverview = useCallback(() => {
    setMode("overview");
    setExitPhase(false);
    setTimeout(() => setSelected(null), 50);
  }, []);

  const districtData = DISTRICT_SHAPES.find((s) => s.id === selected);
  const band = (selected && colors[selected]) ?? "#888";

  const shapeEls = DISTRICT_SHAPES.map((s) => {
    const isSelected = s.id === selected && mode !== "overview";
    const isOther = selected && s.id !== selected && mode !== "overview";
    const c = colors[s.id] ?? "rgb(200,200,200)";
    const count = counts[s.id] ?? 0;

    return (
      <g
        key={s.id}
        onClick={() => mode === "overview" && selectDistrict(s.id)}
        style={{ cursor: mode === "overview" ? "pointer" : "default" }}
      >
        <polygon
          points={s.path.replace(/[MLZ]/g, "").trim()}
          fill={isSelected ? band : isOther ? `${c}66` : c}
          stroke={isSelected ? "#fff" : "rgba(255,255,255,0.4)"}
          strokeWidth={isSelected ? 3 : 1}
          style={{
            transition: "all 0.35s cubic-bezier(0.2,0.8,0.2,1)",
            transform: isOther
              ? `translate(${s.exitX}px, ${s.exitY}px)`
              : isSelected
                ? "scale(1.04)"
                : "translate(0,0)",
            transformOrigin: "center",
          }}
        />
        {isSelected && (
          <circle cx={200} cy={300} r={180} fill="none" stroke={band} strokeWidth={1.5} opacity={0.3}>
            <animate attributeName="r" values="150;190;150" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {mode === "overview" && (
          <>
            <text
              x={s.labelX}
              y={s.labelY}
              textAnchor="middle"
              fill="white"
              fontSize={13}
              fontWeight={700}
              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              {s.label}
            </text>
            {count > 0 && (
              <text
                x={s.labelX}
                y={s.labelY + 18}
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize={10}
                fontWeight={600}
                style={{ pointerEvents: "none" }}
              >
                {count} wydarzeń
              </text>
            )}
          </>
        )}
      </g>
    );
  });

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      {/* Overview SVG */}
      {mode !== "leaflet" && (
        <div
          style={{
            padding: "54px 16px 0",
            opacity: exitPhase ? 0 : 1,
            transition: "opacity 0.25s ease",
          }}
        >
          <div className="pz-eyebrow" style={{ marginBottom: 4 }}>Mapa</div>
          <h1 className="pz-h" style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 12 }}>
            {selected ? selected : "Poznań · dzielnice"}
          </h1>

          <svg viewBox="0 0 400 600" style={{ width: "100%", height: "auto", maxHeight: "calc(100vh - 200px)" }}>
            <path d="M160,600 Q180,450 200,350 Q220,250 200,150 Q180,80 200,0" fill="none" stroke="rgba(120,180,200,0.15)" strokeWidth="20" />
            {shapeEls}
          </svg>
        </div>
      )}

      {/* Leaflet Map - dynamically imported to avoid SSR window error */}
      {mode === "leaflet" && districtData && (
        <LeafletMap
          center={districtData.center}
          events={events}
          selectedDistrict={selected ?? ""}
          onBack={backToOverview}
        />
      )}
    </div>
  );
}
