"use client";

import { EventData } from "@/lib/data";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import EventArt from "@/components/event-art";
import { PinIcon, BookmarkIcon } from "@/components/icons";
import { deriveFriendsGoing } from "@/lib/mock-extras";

const PL_DAY_FULL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const PL_MONTH = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function relDay(d: Date): string {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const days = Math.round((dd.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Dziś";
  if (days === 1) return "Jutro";
  if (days < 0) return "Było";
  if (days < 7) return PL_DAY_FULL[dd.getDay()];
  return `${d.getDate()} ${PL_MONTH[d.getMonth()]}`;
}

export default function EventCard({
  event, onOpen, onSave, saved, dense = false, cardStyle = "gradient", className = "pz-fade-in",
}: {
  event: EventData;
  onOpen?: () => void;
  onSave?: (e: React.MouseEvent) => void;
  saved?: boolean;
  dense?: boolean;
  cardStyle?: "collage" | "gradient" | "typographic";
  className?: string;
}) {
  const friends = deriveFriendsGoing(event);
  const going_count = event.going ?? 0;

  return (
    <div className={`pz-card ${className}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }}>
      <a href={`/event/${event.id}`} tabIndex={-1} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
        <EventArt event={event} height={dense ? 132 : 170} style={cardStyle} className="pz-art-morph" />
      </a>

      <div style={{ padding: dense ? "12px 14px 14px" : "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="pz-eyebrow">{relDay(new Date(event.startDate))} · {event.time ?? "cały dzień"}</span>
          <HeatMeter score={event.score} />
        </div>

        <a href={`/event/${event.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3 className="pz-h" style={{
            fontSize: dense ? 16 : 18, fontWeight: 700, letterSpacing: "-0.025em",
            margin: 0, lineHeight: 1.18,
          }}>{event.title}</h3>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--ink-3)", fontSize: 12 }}>
          <span style={{ width: 14, height: 14 }}><PinIcon size={14} /></span>
          <span style={{ fontWeight: 500 }}>{event.placeName}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{event.district === "Inny" ? "Poznań" : event.district}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AvStack people={friends} max={3} />
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>
              🔥 {event.score}
            </span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSave?.(e); }} style={{
            border: 0, background: "transparent", color: saved ? "var(--ink)" : "var(--ink-4)",
            cursor: "pointer", padding: 4, display: "inline-flex",
          }} aria-label="Save">
            <BookmarkIcon size={18} fill={saved} />
          </button>
        </div>
      </div>
    </div>
  );
}
