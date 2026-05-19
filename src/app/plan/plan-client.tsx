"use client";

import { useState, useMemo } from "react";
import { EventData, categoryColors, districts } from "@/lib/data";
import Link from "next/link";
import HeatMeter from "@/components/heat-meter";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";

export default function PlanClient({ events }: { events: EventData[] }) {
  const today = startOfDay(new Date());
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    [today],
  );
  const [selectedDay, setSelectedDay] = useState(today);

  const dayEvents = useMemo(
    () =>
      events.filter((e) =>
        isSameDay(startOfDay(new Date(e.startDate)), selectedDay)
      ),
    [events, selectedDay]
  );

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, padding: "calc(16px + var(--safe-t)) 18px 100px" }}>
      <div className="pz-eyebrow" style={{ marginBottom: 6 }}>Kalendarz</div>
      <h1 className="pz-h" style={{ margin: "0 0 20px", fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.035em" }}>
        Następne dwa tygodnie.
      </h1>

      {/* Day strip */}
      <div className="pz-scroll" style={{ display: "flex", gap: 8, paddingBottom: 12, marginBottom: 20, overflowX: "auto" }}>
        {days.map((day) => {
          const active = isSameDay(day, selectedDay);
          const hasEvents = events.some((e) => isSameDay(startOfDay(new Date(e.startDate)), day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className="pz-chip"
              data-active={active ? "true" : undefined}
              style={{ flexDirection: "column", gap: 4, padding: "10px 14px" }}
            >
              <span className="pz-eyebrow" style={{ fontSize: 9, color: active ? "var(--bg)" : "var(--ink-4)" }}>{format(day, "EEEEEE", { locale: pl })}</span>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{format(day, "d")}</span>
              {hasEvents && (
                <span style={{ width: 4, height: 4, borderRadius: 99, background: active ? "var(--bg)" : "var(--ink-4)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Events for selected day */}
      {dayEvents.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", color: "var(--ink-4)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌙</div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Luz</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Idź na spacer na Cytadelę</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dayEvents
            .sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00"))
            .map((ev) => (
              <Link
                key={ev.id}
                href={`/event/${ev.id}`}
                style={{ display: "flex", gap: 16, padding: 12, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)", textDecoration: "none", color: "inherit", position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", left: 0, top: 0, width: 4, height: "100%", background: (categoryColors[ev.category]?.bg ?? "#888") }} />
                <div style={{ textAlign: "center", minWidth: 44, paddingLeft: 4 }}>
                  <div className="pz-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)" }}>
                    {ev.time ?? "--:--"}
                  </div>
                </div>
                <div style={{ width: 2, flexShrink: 0, alignSelf: "stretch", borderRadius: 99, background: "var(--line)" }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="pz-pill" style={{ fontSize: 10 }}>{ev.category}</span>
                    <HeatMeter score={ev.score} />
                  </div>
                  <p className="pz-h" style={{ fontSize: 13, fontWeight: 700, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </p>
                  <p style={{ fontSize: 12, marginTop: 2, color: "var(--ink-3)" }}>
                    {ev.placeName} · {districts.find(d => d.value === ev.district)?.label ?? "Poznań"}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
