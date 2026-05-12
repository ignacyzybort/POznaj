"use client";

import { useState } from "react";
import { EventData } from "@/lib/data";
import { differenceInDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import { PinIcon, BookmarkIcon } from "@/components/icons";

function relDay(start: string): string {
  const d = new Date(start);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const days = Math.round((dd.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Dziś";
  if (days === 1) return "Jutro";
  if (days < 0) return "Było";
  if (days < 7) return format(d, "EEEE", { locale: pl });
  return format(d, "d MMM", { locale: pl });
}

const FRIENDS: { name: string }[][] = [
  [{ name: "A" }, { name: "K" }, { name: "M" }],
  [{ name: "T" }],
  [{ name: "Z" }, { name: "Y" }],
  [{ name: "P" }, { name: "J" }],
  [{ name: "E" }],
  [{ name: "M" }, { name: "K" }, { name: "A" }, { name: "W" }, { name: "R" }],
  [{ name: "W" }],
  [],
  [],
  [{ name: "R" }, { name: "T" }, { name: "X" }, { name: "K" }],
  [{ name: "A" }, { name: "K" }],
  [{ name: "Z" }, { name: "Y" }, { name: "X" }, { name: "W" }, { name: "V" }, { name: "U" }, { name: "T" }, { name: "S" }],
];

export default function EventCard({
  event,
  onSave,
  saved,
}: {
  event: EventData;
  onSave?: (e: React.MouseEvent) => void;
  saved?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const idx = parseInt(event.id.replace(/\D/g, "")) || 0;
  const friends = FRIENDS[idx % FRIENDS.length];

  return (
    <div className="bg-[var(--bg-elev)] rounded-[22px] border-[0.5px] border-solid border-[var(--line)] overflow-hidden transition-transform duration-150 active:scale-[0.985] cursor-pointer">
      {/* Art / Image */}
      <a href={`/event/${event.id}`} className="block no-underline" style={{ color: "inherit" }}>
        <div className="relative" style={{ height: 170 }}>
          {event.imageUrl && !imgFailed ? (
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
          ) : (
            <div className="w-full h-full flex items-end p-3" style={{ background: "var(--bg-soft)" }}>
              <span className="text-4xl">{event.category === "Muzyka" ? "🎵" : "📌"}</span>
            </div>
          )}
        </div>
      </a>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Top row: date + HeatMeter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ink-4)" }}>
            {relDay(event.startDate)} · {event.time ?? "cały dzień"}
          </span>
          <HeatMeter score={event.score} />
        </div>

        {/* Title */}
        <a href={`/event/${event.id}`} className="no-underline" style={{ color: "inherit" }}>
          <h3
            className="text-lg font-bold leading-tight tracking-tight m-0"
            style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
          >
            {event.title}
          </h3>
        </a>

        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--ink-3)", fontSize: 12 }}>
          <span style={{ width: 14, height: 14 }}><PinIcon size={14} /></span>
          <span style={{ fontWeight: 500 }}>{event.placeName}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{event.district === "Inny" ? "Poznań" : event.district}</span>
        </div>

        {/* Bottom row: Avatars + going count + save */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AvStack people={friends} max={3} />
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>
              {100 + idx * 50} idzie
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onSave?.(e); }}
            style={{
              border: 0, background: "transparent",
              color: saved ? "var(--ink)" : "var(--ink-4)",
              cursor: "pointer", padding: 4, display: "inline-flex",
            }}
            aria-label="Zapisz"
          >
            <BookmarkIcon size={18} fill={saved} />
          </button>
        </div>
      </div>
    </div>
  );
}
