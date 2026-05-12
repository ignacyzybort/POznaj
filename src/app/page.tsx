"use client";

import { useState, useMemo, useEffect } from "react";
import { EventData, vibeEmoji } from "@/lib/data";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import EventCard from "@/components/event-card";
import HeatMeter from "@/components/heat-meter";
import SurpriseModal from "@/components/surprise-modal";

type QuickFilter = "" | "today" | "tonight" | "tomorrow" | "weekend" | "week";

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quick, setQuick] = useState<QuickFilter>("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  const today = new Date();
  const dayName = format(today, "EEEE", { locale: pl });
  const dayDate = format(today, "d MMMM", { locale: pl });

  const topEvents = useMemo(
    () => [...events].sort((a, b) => b.score - a.score),
    [events]
  );
  const heroEvents = topEvents.slice(0, 5);
  const forYou = topEvents.slice(0, 5);

  const filtered = useMemo(() => {
    let e = [...events];
    if (quick === "today")
      e = e.filter((ev) => new Date(ev.startDate).toDateString() === today.toDateString());
    if (quick === "tonight")
      e = e.filter((ev) => {
        const d = new Date(ev.startDate);
        return d.toDateString() === today.toDateString() && (ev.time ?? "20:00") >= "18:00";
      });
    if (quick === "tomorrow") {
      const tom = new Date(today); tom.setDate(tom.getDate() + 1);
      e = e.filter((ev) => new Date(ev.startDate).toDateString() === tom.toDateString());
    }
    if (quick === "weekend") {
      const sat = new Date(today); sat.setDate(sat.getDate() + (6 - sat.getDay()));
      const sun = new Date(sat); sun.setDate(sun.getDate() + 1);
      e = e.filter((ev) => {
        const d = new Date(ev.startDate).toDateString();
        return d === sat.toDateString() || d === sun.toDateString();
      });
    }
    if (quick === "week") {
      const end = new Date(today); end.setDate(end.getDate() + 7);
      e = e.filter((ev) => new Date(ev.startDate) <= end);
    }
    if (search) {
      const q = search.toLowerCase();
      e = e.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          ev.placeName.toLowerCase().includes(q)
      );
    }
    return e;
  }, [quick, search, events]);

  const quickChips: { key: QuickFilter; label: string }[] = [
    { key: "today", label: "Dziś" },
    { key: "tonight", label: "Wieczorem" },
    { key: "tomorrow", label: "Jutro" },
    { key: "weekend", label: "Weekend" },
    { key: "week", label: "Ten tydzień" },
  ];

  return (
    <>
    <div className="pz-scroll" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "54px 18px 120px" }}>
        {/* Date header */}
        <div className="pz-eyebrow" style={{ marginBottom: 2 }}>{dayName}, {dayDate}</div>
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight" style={{ color: "var(--ink)" }}>
            Co dziś<br />w Poznaniu.
          </h1>
          <div className="flex gap-2 shrink-0 mt-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-0 cursor-pointer transition-transform active:scale-90"
              style={{
                background: showSearch || search ? "var(--ink)" : "var(--bg-soft)",
                color: showSearch || search ? "var(--bg)" : "var(--ink-2)",
              }}
            >
              🔍
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-0 cursor-pointer transition-transform active:scale-90 relative"
              style={{ background: showFilters ? "var(--ink)" : "var(--bg-soft)", color: showFilters ? "var(--bg)" : "var(--ink-2)" }}
            >
              🎛️
            </button>
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="mb-5 pz-fade-in">
            <input
              autoFocus
              type="text"
              placeholder="Szukaj wydarzeń..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl text-sm font-medium border-0 outline-none"
              style={{
                background: "var(--bg-soft)",
                color: "var(--ink)",
              }}
            />
          </div>
        )}

        {/* Quick chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {quickChips.map((chip) => {
            const active = quick === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setQuick(active ? "" : chip.key)}
                className="px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
                style={{
                  background: active ? "var(--ink)" : "var(--bg-elev)",
                  color: active ? "var(--bg)" : "var(--ink-2)",
                  border: active ? "none" : "0.5px solid var(--line)",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Tonight Hero */}
        {!search && !quick && !showFilters && (
          <div className="mb-6 relative rounded-[22px] overflow-hidden" style={{ height: 240 }}>
            <img
              src={heroEvents[heroIdx]?.imageUrl ?? ""}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 mb-2" style={{ color: "var(--ink-2)" }}>
                🌙 Dziś wieczorem
              </span>
              <h2 className="text-white text-xl font-bold leading-tight mb-1">
                {heroEvents[heroIdx]?.title}
              </h2>
              <div className="flex items-center gap-3 text-white/80 text-xs">
                <span>📍 {heroEvents[heroIdx]?.placeName}</span>
                <span>🕐 {heroEvents[heroIdx]?.time}</span>
                <span>🔥 {heroEvents[heroIdx]?.score}</span>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              {heroEvents.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setHeroIdx(i); }}
                  className="w-2 h-2 rounded-full border-0 p-0 cursor-pointer transition-all"
                  style={{
                    background: i === heroIdx ? "white" : "rgba(255,255,255,0.4)",
                    width: i === heroIdx ? 8 : 6,
                    height: i === heroIdx ? 8 : 6,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Surprise Me */}
        {!search && !quick && !showFilters && (
          <div className="mb-6">
            <button
              onClick={() => setShowSurprise(true)}
              className="w-full py-4 rounded-2xl text-sm font-bold border-2 border-dashed cursor-pointer transition-all active:scale-[0.98]"
              style={{
                borderColor: "var(--line-2)",
                color: "var(--ink-2)",
                background: "transparent",
              }}
            >
              🔀 Zaskocz mnie
            </button>
          </div>
        )}

        {/* For You rail */}
        {forYou.length > 0 && !search && !quick && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>Pod Ciebie</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {forYou.map((ev) => (
                <a
                  key={ev.id}
                  href={`/event/${ev.id}`}
                  className="shrink-0 w-56 rounded-2xl overflow-hidden border-[0.5px] border-solid transition-transform active:scale-[0.98]"
                  style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}
                >
                  <div className="h-28 overflow-hidden bg-[var(--bg-soft)]">
                    <img src={ev.imageUrl ?? ""} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
                      <span>📅</span>
                      <span>{new Date(ev.startDate).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "var(--ink)" }}>
                      {ev.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>{ev.placeName}</span>
                      <HeatMeter score={ev.score} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* All events */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--ink)" }}>
            {quick || search || showFilters ? "Wyniki" : "Wszystko, co się dzieje"}
            <span className="text-sm font-normal ml-2" style={{ color: "var(--ink-4)" }}>
              ({filtered.length})
            </span>
          </h2>
          {filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: "var(--ink-4)" }}>
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm font-medium">Nic tu nie ma</p>
              <p className="text-xs mt-1">Spróbuj poluzować filtry</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {showSurprise && (
      <SurpriseModal
        events={events}
        onPick={(ev) => { window.location.href = `/event/${ev.id}`; }}
        onClose={() => setShowSurprise(false)}
      />
    )}
    </>
  );
}
