"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { EventData } from "@/lib/data";
import { categories } from "@/lib/data";

const DistrictMap = dynamic(() => import("@/components/district-map"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="pz-skeleton pz-skeleton-breath" style={{ width: "88%", height: "60%", borderRadius: 28 }} />
    </div>
  ),
});

type When = "all" | "today" | "tomorrow";

export default function MapaClient({ events }: { events: EventData[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [when, setWhen] = useState<When>("all");
  const [outdoorOnly, setOutdoorOnly] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = tomorrow.toDateString();

    const MAP_DISTRICTS = new Set(["Centrum", "StareMiasto", "NoweMiasto", "Jezyce", "Grunwald", "Wilda"]);

    return events.filter((e) => {
      if (!MAP_DISTRICTS.has(e.district)) return false;
      if (category && e.category !== category) return false;
      if (outdoorOnly && !e.outdoor) return false;
      const d = new Date(e.startDate);
      if (when === "today" && d.toDateString() !== todayKey) return false;
      if (when === "tomorrow" && d.toDateString() !== tomorrowKey) return false;
      return true;
    });
  }, [events, category, when, outdoorOnly]);

  const chip = (active: boolean) => ({
    flex: "0 0 auto" as const,
    padding: "7px 13px",
    borderRadius: 99,
    border: 0,
    cursor: "pointer" as const,
    fontSize: 12,
    fontWeight: 700 as const,
    background: active ? "var(--ink)" : "var(--bg-elev)",
    color: active ? "var(--bg)" : "var(--ink-2)",
    boxShadow: "var(--shadow-sm)",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{
        position: "absolute", top: "calc(74px + var(--safe-t))", left: 0, right: 0,
        zIndex: 1001, padding: "0 18px", pointerEvents: "none",
      }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, pointerEvents: "auto", touchAction: "pan-x" }}>
          <button style={chip(!category)} onClick={() => setCategory(null)} aria-pressed={!category}>Wszystkie</button>
          {categories.map((c) => (
            <button key={c.value} style={chip(category === c.value)} onClick={() => setCategory(category === c.value ? null : c.value)} aria-pressed={category === c.value}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, pointerEvents: "auto" }}>
          <button style={chip(when === "all")} onClick={() => setWhen("all")} aria-pressed={when === "all"}>Kiedy</button>
          <button style={chip(when === "today")} onClick={() => setWhen(when === "today" ? "all" : "today")} aria-pressed={when === "today"}>Dziś</button>
          <button style={chip(when === "tomorrow")} onClick={() => setWhen(when === "tomorrow" ? "all" : "tomorrow")} aria-pressed={when === "tomorrow"}>Jutro</button>
          <button style={chip(outdoorOnly)} onClick={() => setOutdoorOnly(!outdoorOnly)} aria-pressed={outdoorOnly}>Na zewnątrz</button>
          <span style={{ marginLeft: "auto", alignSelf: "center", fontSize: 11, fontWeight: 600, color: "var(--ink-3)", background: "var(--bg-elev)", padding: "5px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
            {filtered.length}
          </span>
        </div>
      </div>

      <DistrictMap
        events={filtered}
        selectedDistrict={selected}
        onSelect={setSelected}
        onBack={() => setSelected(null)}
      />
    </div>
  );
}
