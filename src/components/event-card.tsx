"use client";

import { EventData, categoryColors, categoryEmoji, vibeEmoji } from "@/lib/data";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import HeatMeter from "@/components/heat-meter";

function fmtDate(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isSameDay(s, e)) return format(s, "d MMM", { locale: pl });
  return `${format(s, "d", { locale: pl })}–${format(e, "d MMM", { locale: pl })}`;
}

function getCategoryStyle(cat: string) {
  const c = categoryColors[cat];
  return c ? { background: c.bg, color: c.fg } : {};
}

export default function EventCard({ event }: { event: EventData }) {
  const catStyle = getCategoryStyle(event.category);
  const today = new Date();
  const eventDate = new Date(event.startDate);
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let when: string;
  if (diffDays === 0) when = "Dziś";
  else if (diffDays === 1) when = "Jutro";
  else if (diffDays < 0) when = "Minęło";
  else when = fmtDate(event.startDate, event.endDate);

  return (
    <a href={`/event/${event.id}`} className="block group">
      <article
        className="bg-[var(--bg-elev)] rounded-[22px] border-[0.5px] border-solid border-[var(--line)] overflow-hidden transition-transform duration-150 active:scale-[0.985]"
      >
        <div className="relative h-40 overflow-hidden bg-[var(--bg-soft)]">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-soft)" }}>
              <span className="text-2xl">{event.category === "Muzyka" ? "🎵" : "📌"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/85 backdrop-blur-sm shadow-sm" style={{ color: "var(--ink-2)" }}>
              📅 {when}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm"
              style={catStyle}
            >
              {categoryEmoji[event.category]} {event.category}
            </span>
          </div>
        </div>
        <div className="p-3.5 space-y-2.5">
          <h2 className="text-[15px] font-bold leading-snug line-clamp-2 transition-colors group-hover:opacity-60" style={{ color: "var(--ink)" }}>
            {event.title}
          </h2>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
            <span>📍</span>
            <span className="truncate">{event.placeName}</span>
            {event.time && (
              <>
                <span className="opacity-40">·</span>
                <span>🕐 {event.time}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex flex-wrap gap-1">
              {event.vibes.map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-soft)]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {vibeEmoji[v] ?? ""} {v === "WyjscieZeZnajomymi" ? "Znajomi" : v}
                </span>
              ))}
            </div>
            <HeatMeter score={event.score} />
          </div>
        </div>
      </article>
    </a>
  );
}
