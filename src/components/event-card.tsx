"use client";

import { useState } from "react";
import { EventData } from "@/lib/data";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import { PinIcon, BookmarkIcon } from "@/components/icons";

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

function fmtShortDate(d: Date) {
  return `${d.getDate()} ${PL_MONTH[d.getMonth()]}`;
}

const FRIENDS_LIST: { name: string }[][] = [
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
  event, onOpen, onSave, saved, going, onGoing, dense = false,
}: {
  event: EventData;
  onOpen?: () => void;
  onSave?: (e: React.MouseEvent) => void;
  saved?: boolean;
  going?: boolean;
  onGoing?: (e: React.MouseEvent) => void;
  dense?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const idx = parseInt(event.id.replace(/\D/g, "")) || 0;
  const friends = FRIENDS_LIST[idx % FRIENDS_LIST.length];

  return (
    <div className="pz-card pz-fade-in" onClick={onOpen} style={{ cursor: "pointer" }}>
      {/* Art */}
      <a href={`/event/${event.id}`} tabIndex={-1} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
        <div className="pz-art" style={{ height: dense ? 132 : 170, background: "var(--bg-soft)" }}>
          {event.imageUrl && !imgFailed ? (
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
          ) : (
            <div className="w-full h-full flex items-end p-3">
              <span className="text-4xl">🎵</span>
            </div>
          )}
        </div>
      </a>

      {/* Content */}
      <div style={{ padding: dense ? "12px 14px 14px" : "14px 16px 16px" }}>
        {/* Top row: eyebrow date + HeatMeter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="pz-eyebrow">{relDay(new Date(event.startDate))} · {event.time ?? "cały dzień"}</span>
          <HeatMeter score={event.score} />
        </div>

        {/* Title */}
        <a href={`/event/${event.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3 className={dense ? "pz-h" : "pz-h"} style={{
            fontSize: dense ? 16 : 18, fontWeight: 700, letterSpacing: "-0.025em",
            margin: 0, lineHeight: 1.18,
          }}>{event.title}</h3>
        </a>

        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "var(--ink-3)", fontSize: 12 }}>
          <span style={{ width: 14, height: 14 }}><PinIcon size={14} /></span>
          <span style={{ fontWeight: 500 }}>{event.placeName}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{event.district === "Inny" ? "Poznań" : event.district}</span>
        </div>

        {/* Bottom row: avatars + going count + save */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AvStack people={friends} max={3} />
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>
              {(100 + idx * 50).toLocaleString("pl-PL")} idzie
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
