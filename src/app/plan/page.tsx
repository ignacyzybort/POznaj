"use client";

import { useState, useEffect, useMemo } from "react";
import { EventData } from "@/lib/data";
import Link from "next/link";
import HeatMeter from "@/components/heat-meter";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";

export default function PlanPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const [selectedDay, setSelectedDay] = useState(today);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  const dayEvents = useMemo(
    () =>
      events.filter((e) =>
        isSameDay(startOfDay(new Date(e.startDate)), selectedDay)
      ),
    [events, selectedDay]
  );

  return (
    <div className="p-5 pt-10" style={{ paddingBottom: 100 }}>
      <div className="pz-eyebrow">Kalendarz</div>
      <h1 className="text-3xl font-bold tracking-tight mt-1 mb-5" style={{ color: "var(--ink)" }}>
        Następne dwa tygodnie.
      </h1>

      {/* Day strip */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
        {days.map((day) => {
          const active = isSameDay(day, selectedDay);
          const hasEvents = events.some((e) => isSameDay(startOfDay(new Date(e.startDate)), day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className="flex flex-col items-center gap-1 py-2.5 px-3.5 rounded-2xl border-0 cursor-pointer transition-all shrink-0"
              style={{
                background: active ? "var(--ink)" : "var(--bg-elev)",
                color: active ? "var(--bg)" : "var(--ink-2)",
                border: active ? "none" : "0.5px solid var(--line)",
              }}
            >
              <span className="text-[10px] font-semibold">{format(day, "EEEEE", { locale: pl })}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
              {hasEvents && (
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: active ? "var(--bg)" : "var(--ink-3)" }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Events for selected day */}
      {dayEvents.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--ink-4)" }}>
          <div className="text-4xl mb-3">🌙</div>
          <p className="text-base font-semibold">Luz</p>
          <p className="text-sm mt-1">Idź na spacer na Cytadelę</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents
            .sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"))
            .map((ev) => (
              <Link
                key={ev.id}
                href={`/event/${ev.id}`}
                className="flex items-start gap-4 p-3 rounded-2xl no-underline"
                style={{ background: "var(--bg-soft)" }}
              >
                <div className="text-center min-w-[40px]">
                  <div className="text-xs font-bold" style={{ color: "var(--ink-3)" }}>
                    {ev.time ?? "--:--"}
                  </div>
                </div>
                <div className="w-0.5 shrink-0 self-stretch rounded-full" style={{ background: "var(--line)" }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-elev)", color: "var(--ink-3)" }}>
                      {ev.category}
                    </span>
                    <HeatMeter score={ev.score} />
                  </div>
                  <p className="text-sm font-bold mt-1 line-clamp-1" style={{ color: "var(--ink)" }}>
                    {ev.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                    📍 {ev.placeName} · {ev.district === "Inny" ? "Poznań" : ev.district}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
