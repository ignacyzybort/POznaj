"use client";

import { Event } from "@/generated/prisma";
import { categoryVisual, categoryColors, vibeColors, vibeIcons } from "@/lib/visuals";
import { preferenceLabels } from "@/lib/filters";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import HeatMeter from "@/components/heat-meter";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isSameDay(s, e)) return format(s, "d MMM", { locale: pl });
  return `${format(s, "d", { locale: pl })}–${format(e, "d MMM", { locale: pl })}`;
}

type EventWithVibes = Event & { vibes: string[] };

export default function EventCard({ event }: { event: EventWithVibes }) {
  const vis = categoryVisual[event.category] ?? categoryVisual.Inne;
  const vibes = event.vibes ?? [];

  return (
    <a href={`/event/${event.id}`} className="group block">
      <article className="rounded-2xl bg-white border border-zinc-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:border-amber-200 hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden bg-zinc-50">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">{vis.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 text-xs font-bold text-zinc-700 rounded-full shadow-sm">
              📅 {formatDateRange(event.startDate.toString(), event.endDate.toString())}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-full shadow-sm ${categoryColors[event.category] ?? "bg-zinc-100 text-zinc-700"}`}
            >
              {vis.emoji} {preferenceLabels[event.category] ?? event.category}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <h2 className="text-[15px] font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors">
            {event.title}
          </h2>
          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
            <span>📍</span>
            <span className="truncate">{event.placeName}</span>
            {event.time && (
              <>
                <span className="text-zinc-300">·</span>
                <span>🕐 {event.time}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-wrap gap-1">
              {vibes.map((v) => (
                <span
                  key={v}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vibeColors[v] ?? "bg-zinc-100 text-zinc-600"}`}
                >
                  {vibeIcons[v] ?? ""} {preferenceLabels[v] ?? v}
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
