"use client";

import { useState } from "react";
import Link from "next/link";
import { EventData, categoryColors } from "@/lib/data";
import { relWhen } from "@/lib/date";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import EventArt from "@/components/event-art";
import { PinIcon, BookmarkIcon } from "@/components/icons";
import { getVenueSlug } from "@/lib/slug";

export default function EventCard({
  event, onOpen, onSave, saved, savedSlots, dense = false, cardStyle = "typographic", className = "",
}: {
  event: EventData;
  onOpen?: () => void;
  onSave?: (timeSlot?: string) => void;
  saved?: boolean;
  savedSlots?: string[];
  dense?: boolean;
  cardStyle?: "collage" | "gradient" | "typographic";
  className?: string;
}) {
  const friends = event.friendsGoing ?? [];
  const going_count = event.going ?? 0;
  const showtimes = event.time?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const multiSeance = showtimes.length > 1;

  const [bouncing, setBouncing] = useState(false);
  const pop = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 350);
  };

  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }} className={`pz-card pz-card-lift ${className}`} style={{ cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ pointerEvents: "none" }}>
        <EventArt event={event} height={dense ? 132 : 170} style={cardStyle} />
      </div>

      <div style={{ padding: dense ? "12px 14px 14px" : "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="pz-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 99, background: (categoryColors[event.category] ?? categoryColors.Inne).bg, flexShrink: 0 }} />
            {relWhen(event.startDate, event.endDate)}
            {multiSeance ? ` · ${showtimes.length} ${showtimes.length === 1 ? "seans" : showtimes.length < 5 ? "seanse" : "seansów"}` : event.time ? ` · ${event.time}` : " · cały dzień"}
          </span>
          <HeatMeter score={event.score} />
        </div>

        <h3 className="pz-display" style={{
          fontSize: dense ? 18 : 22, fontWeight: 400, letterSpacing: "-0.025em",
          margin: 0, lineHeight: 1.05, cursor: "pointer",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{event.title}</h3>

        {multiSeance && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {showtimes.map((t) => {
              const isSlotSaved = savedSlots?.includes(t);
              return (
                <button key={t} className="pz-chip pz-chip-spring" aria-pressed={isSlotSaved}
                        data-active={isSlotSaved ? "true" : undefined}
                        onClick={(e) => { e.stopPropagation(); onSave?.(t); }}
                        style={{ fontSize: 11, padding: "3px 8px", border: 0, cursor: "pointer" }}>
                  {t}{isSlotSaved ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--ink-3)", fontSize: 13, minWidth: 0 }}>
          <span style={{ width: 14, height: 14, flexShrink: 0 }}><PinIcon size={14} /></span>
          <Link href={`/miejsca/${getVenueSlug(event.placeName)}`} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 500, color: "inherit", textDecoration: "none", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {event.placeName}
          </Link>
          <span style={{ opacity: 0.5, flexShrink: 0 }}>·</span>
          <span style={{ flexShrink: 0 }}>{event.district === "Inny" ? "Poznań" : event.district}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {friends.length > 0 && <AvStack people={friends} max={3} />}
            {going_count > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-4)", letterSpacing: "-0.01em" }}>
                {going_count} idzie
              </span>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); pop(); onSave?.(); }} aria-label="Zapisz" className={bouncing ? "pz-bookmark-bounce" : ""} style={{
            border: 0, background: "transparent", color: saved ? "var(--ink)" : "var(--ink-4)",
            cursor: "pointer", padding: 0, display: "inline-flex", width: 44, height: 44, alignItems: "center", justifyContent: "center",
          }}>
            <BookmarkIcon size={18} fill={saved} />
          </button>
        </div>
      </div>
    </div>
  );
}
