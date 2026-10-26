"use client";

import { useRef, useState } from "react";
import { categoryColors, type EventData } from "@/lib/data";
import { relWhen } from "@/lib/date";
import EventArt from "@/components/event-art";
import { ChevronIcon } from "@/components/icons";

const CAT_LABEL: Record<string, string> = {
  Kino: "Kino", Muzyka: "Muzyka", Sztuka: "Sztuka", Sport: "Sport",
  Teatr: "Teatr", Warsztaty: "Warsztaty", Konferencje: "Konferencje",
  Jedzenie: "Jedzenie", Inne: "Inne",
};

export default function TonightHero({
  events, onOpen,
}: {
  events: EventData[];
  onOpen: (ev: EventData) => void;
}) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(0);

  if (!events.length) return null;
  const ev = events[idx];
  const next = () => setIdx((i) => (i + 1) % events.length);
  const prev = () => setIdx((i) => (i - 1 + events.length) % events.length);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="pz-poster-hero"
      style={{ margin: "0 16px 18px" }}
    >
      <EventArt event={ev} height={460} style="gradient" forceArt />
      <div className="pz-poster-number" aria-hidden="true" style={{
        position: "absolute", top: 52, left: 12, zIndex: 2, color: "white",
        fontSize: 150, opacity: 0.14,
      }}>{String(idx + 1).padStart(2, "0")}</div>

      <div style={{
        position: "absolute", inset: 0, zIndex: 3, padding: 20,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        color: "white",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <span className="pz-issue-tag" style={{ background: "rgba(0,0,0,0.55)", color: "white" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: categoryColors[ev.category]?.bg ?? "white" }} />
            {relWhen(ev.startDate, ev.endDate) === "Dziś"
              ? "Dziś wieczorem"
              : relWhen(ev.startDate, ev.endDate) === "Trwa"
                ? "Trwa · polecane"
                : `Polecane · ${relWhen(ev.startDate, ev.endDate)}`}
          </span>
          <div style={{ display: "flex", gap: 4, paddingTop: 6 }}>
            {events.map((_, i) => (
              <span key={i} style={{
                width: i === idx ? 20 : 5, height: 5, borderRadius: 99,
                background: i === idx ? "white" : "rgba(255,255,255,0.42)",
                transition: "width var(--dur-base) var(--ease-out-quart)",
              }} />
            ))}
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(ev); } }}
          onClick={() => onOpen(ev)}
          style={{ cursor: "pointer", position: "relative" }}
        >
          <div className="pz-poster-index" style={{ marginBottom: 8, opacity: 0.78, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {CAT_LABEL[ev.category] ?? ev.category} · {ev.time ?? "cały dzień"} · {ev.placeName}
          </div>
          <h1 className="pz-poster-title" style={{ margin: 0 }}>{ev.title}</h1>
          {ev.description && (
            <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", lineHeight: 1.4, opacity: 0.9, maxWidth: "92%" }}>
              {ev.description.length > 100 ? `${ev.description.slice(0, 100)}…` : ev.description}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={(e) => { e.stopPropagation(); onOpen(ev); }} style={{
              flex: 1, height: 48, border: 0, borderRadius: 999,
              background: "white", color: "#14130F",
              fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", fontWeight: 700,
              letterSpacing: "-0.01em", cursor: "pointer",
            }}>Zobacz wydarzenie</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Następne wydarzenie" style={{
              width: 48, height: 48, border: "1px solid rgba(255,255,255,0.45)", borderRadius: 999,
              background: "rgba(0,0,0,0.25)", color: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <ChevronIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
