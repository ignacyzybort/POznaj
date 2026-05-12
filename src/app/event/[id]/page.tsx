"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Event } from "@/generated/prisma";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { preferenceLabels } from "@/lib/filters";
import { categoryVisual, categoryColors, vibeColors, vibeIcons } from "@/lib/visuals";
import HeatMeter from "@/components/heat-meter";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isSameDay(s, e)) return format(s, "d MMMM yyyy", { locale: pl });
  return `${format(s, "d", { locale: pl })}–${format(e, "d MMMM yyyy", { locale: pl })}`;
}

type EventDetail = Event & { vibes: string[] };

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${params.id}`);
        const data = await res.json();
        setEvent(data.event ?? null);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="animate-pulse space-y-5">
          <div className="h-72 bg-zinc-100 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-5 w-1/3 bg-zinc-100 rounded-lg" />
            <div className="h-8 w-2/3 bg-zinc-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <span className="text-5xl mb-4 block">😕</span>
        <p className="text-lg font-bold text-zinc-900">Nie znaleziono wydarzenia</p>
        <a href="/" className="text-sm text-zinc-400 hover:text-zinc-700 mt-2 inline-block transition-colors">
          ← Wróć do listy
        </a>
      </div>
    );
  }

  const vis = categoryVisual[event.category] ?? categoryVisual.Inne;
  const vibes = event.vibes ?? [];

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-8"
      >
        ← Wszystkie wydarzenia
      </a>

      <article className="space-y-8">
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-zinc-50">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl">{vis.emoji}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full ${categoryColors[event.category] ?? "bg-zinc-100 text-zinc-700"}`}>
                {vis.emoji} {preferenceLabels[event.category] ?? event.category}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full bg-zinc-50 text-zinc-500 border border-zinc-200">
                📍 {preferenceLabels[event.district] ?? event.district}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 leading-tight">
              {event.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data</p>
                <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                  {formatDateRange(event.startDate.toString(), event.endDate.toString())}
                </p>
                {event.time && <p className="text-sm text-zinc-500">🕐 {event.time}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Miejsce</p>
                <p className="text-sm font-semibold text-zinc-900 mt-0.5">{event.placeName}</p>
                {event.address && <p className="text-sm text-zinc-500">{event.address}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xl">💫</span>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nastroje</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {vibes.map((v) => (
                    <span
                      key={v}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${vibeColors[v] ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {vibeIcons[v] ?? ""} {preferenceLabels[v] ?? v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-xl">🔥</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Popularność</p>
                <div className="mt-1">
                  <HeatMeter score={event.score} size="md" />
                </div>
              </div>
            </div>
          </div>

          {event.description && (
            <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-100">
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all duration-200 shadow-lg shadow-zinc-900/20"
          >
            🚀 Otwórz źródło
          </a>
        </div>
      </article>
    </div>
  );
}
