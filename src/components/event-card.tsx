"use client";

import { useState, useEffect } from "react";
import { EventData } from "@/lib/data";
import { relDay } from "@/lib/date";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import EventArt from "@/components/event-art";
import { PinIcon, BookmarkIcon } from "@/components/icons";

export default function EventCard({
  event, onOpen, onSave, saved, dense = false, cardStyle = "gradient", className = "",
}: {
  event: EventData;
  onOpen?: () => void;
  onSave?: (e: React.MouseEvent) => void;
  saved?: boolean;
  dense?: boolean;
  cardStyle?: "collage" | "gradient" | "typographic";
  className?: string;
}) {
  const friends = event.friendsGoing ?? [];
  const going_count = event.going ?? 0;

  const [bouncing, setBouncing] = useState(false);
  useEffect(() => {
    setBouncing(true);
    const t = setTimeout(() => setBouncing(false), 350);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }} className={`pz-card pz-card-lift ${className}`} style={{ cursor: "pointer" }}>
      <div style={{ pointerEvents: "none" }}>
        <EventArt event={event} height={dense ? 132 : 170} style={cardStyle} />
      </div>

      <div style={{ padding: dense ? "12px 14px 14px" : "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="pz-eyebrow">{relDay(new Date(event.startDate))} · {event.time ?? "cały dzień"}</span>
          <HeatMeter score={event.score} />
        </div>

        <h3 className="pz-h" style={{
          fontSize: dense ? 16 : 18, fontWeight: 700, letterSpacing: "-0.025em",
          margin: 0, lineHeight: 1.18, cursor: "pointer",
        }}>{event.title}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>
          <span style={{ width: 14, height: 14 }}><PinIcon size={14} /></span>
          <span style={{ fontWeight: 500 }}>{event.placeName}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{event.district === "Inny" ? "Poznań" : event.district}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {friends.length > 0 && <AvStack people={friends} max={3} />}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSave?.(e); }} aria-label="Zapisz" className={bouncing ? "pz-bookmark-bounce" : ""} style={{
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
