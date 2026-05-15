"use client";

import { useRef, useState } from "react";
import { categoryColors, type EventData } from "@/lib/data";
import { relDay } from "@/lib/date";
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
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{
      position: "relative", borderRadius: 26, overflow: "hidden",
      height: 420, margin: "0 16px 18px",
      background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)",
    }}>
      <EventArt event={ev} height={420} style="gradient" forceArt />
      <div style={{
        position: "absolute", inset: 0, padding: 20,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.75) 100%)",
        color: "white",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 99,
            background: "rgba(0,0,0,0.45)",
            fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: categoryColors[ev.category].bg, boxShadow: `0 0 8px ${categoryColors[ev.category].bg}` }} />
            Dziś wieczorem
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {events.map((_, i) => (
              <span key={i} style={{
                width: i === idx ? 18 : 5, height: 5, borderRadius: 99,
                background: i === idx ? "white" : "rgba(255,255,255,0.4)",
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
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{
              padding: "4px 10px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 700,
              background: "rgba(0,0,0,0.45)",
            }}>{CAT_LABEL[ev.category] ?? ev.category}</span>
            <span style={{
              padding: "4px 10px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 700,
              background: "rgba(0,0,0,0.45)",
            }}>{ev.time ?? relDay(new Date(ev.startDate))} · {ev.placeName}</span>
          </div>
          <h1 className="pz-h" style={{
            margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}>{ev.title}</h1>
          {ev.description && (
            <p style={{ margin: "10px 0 14px", fontSize: "var(--text-base)", lineHeight: 1.4, opacity: 0.92 }}>
              {ev.description.length > 110 ? `${ev.description.slice(0, 110)}…` : ev.description}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: ev.description ? 0 : 14 }}>
            <button onClick={(e) => { e.stopPropagation(); onOpen(ev); }} style={{
              flex: 1, height: 46, border: 0, borderRadius: 14,
              background: "var(--bg-elev)", color: "var(--ink)",
              fontSize: "var(--text-base)", fontWeight: 700, letterSpacing: "-0.01em", cursor: "pointer",
            }}>Sprawdź</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Następny" style={{
              width: 46, height: 46, border: 0, borderRadius: 14,
              background: "rgba(0,0,0,0.35)", color: "white",
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
