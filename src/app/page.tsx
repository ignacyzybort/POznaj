"use client";

import { useState, useMemo, useEffect } from "react";
import { EventData, vibeEmoji, categoryEmoji } from "@/lib/data";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import EventCard from "@/components/event-card";
import HeatMeter from "@/components/heat-meter";
import SurpriseModal from "@/components/surprise-modal";
import { SearchIcon, FilterIcon } from "@/components/icons";

type QuickFilter = "" | "today" | "tonight" | "tomorrow" | "weekend" | "week";

const PL_DAY_FULL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const PL_MONTH_FULL = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const PL_MONTH = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function fmtFullDate(d: Date) {
  return `${d.getDate()} ${PL_MONTH_FULL[d.getMonth()]}`;
}

function fmtShortDate(d: Date) {
  return `${d.getDate()} ${PL_MONTH[d.getMonth()]}`;
}

function relDay(d: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const days = Math.round((dd.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Dziś";
  if (days === 1) return "Jutro";
  if (days < 0) return "Było";
  if (days < 7) return PL_DAY_FULL[dd.getDay()];
  return fmtShortDate(d);
}

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quick, setQuick] = useState<QuickFilter>("");
  const [heroIdx, setHeroIdx] = useState(0);
  const [showSurprise, setShowSurprise] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  const today = new Date();
  const dayName = PL_DAY_FULL[today.getDay()];
  const dayDate = fmtFullDate(today);

  const topEvents = useMemo(() => [...events].sort((a, b) => b.score - a.score), [events]);
  const heroEvents = topEvents.slice(0, 5);
  const forYou = topEvents.slice(0, 5);

  const filtered = useMemo(() => {
    let e = [...events];
    const now = new Date();
    if (quick === "today") e = e.filter((ev) => new Date(ev.startDate).toDateString() === now.toDateString());
    if (quick === "tonight") e = e.filter((ev) => { const s = new Date(ev.startDate); return s.toDateString() === now.toDateString() && s.getHours() >= 18; });
    if (quick === "tomorrow") { const t = new Date(now); t.setDate(t.getDate() + 1); e = e.filter((ev) => new Date(ev.startDate).toDateString() === t.toDateString()); }
    if (quick === "weekend") e = e.filter((ev) => { const d = new Date(ev.startDate); const diff = Math.round((d.getTime() - now.getTime()) / 86400000); return diff >= 0 && diff <= 5 && (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0); });
    if (quick === "week") e = e.filter((ev) => (new Date(ev.startDate).getTime() - now.getTime()) / 86400000 < 7);
    if (search) { const q = search.toLowerCase(); e = e.filter((ev) => ev.title.toLowerCase().includes(q) || ev.placeName.toLowerCase().includes(q)); }
    return e;
  }, [quick, search, events]);

  const activeCount = 0; // would come from filters
  const qChips = [
    { key: "today" as QuickFilter, label: "Dziś" },
    { key: "tonight" as QuickFilter, label: "Wieczorem" },
    { key: "tomorrow" as QuickFilter, label: "Jutro" },
    { key: "weekend" as QuickFilter, label: "Weekend" },
    { key: "week" as QuickFilter, label: "Ten tydzień" },
  ];

  const toggleSave = (id: string) => {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  return (
    <>
      <div className="absolute inset-0 overflow-y-auto" style={{ paddingBottom: 96 }}>
        {/* Top bar — Apple-y large title */}
        <div style={{ padding: "54px 18px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "var(--ink-4)" }}>
                {dayName}, {dayDate}
              </div>
              <h1 className="font-bold leading-[0.95] m-0" style={{ fontSize: 36, letterSpacing: "-0.035em" }}>
                Co dziś<br />w Poznaniu.
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowSearch(!showSearch)} aria-label="Szukaj" style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: showSearch ? "var(--ink)" : "var(--bg-soft)", color: showSearch ? "var(--bg)" : "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <SearchIcon size={20} />
              </button>
              <button onClick={() => setShowFilters(!showFilters)} aria-label="Filtry" style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: activeCount ? "var(--ink)" : "var(--bg-soft)", color: activeCount ? "var(--bg)" : "var(--ink)", cursor: "pointer", position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <FilterIcon size={20} />
                {activeCount > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 99, background: "var(--hot)", color: "white", fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick chips */}
        <div style={{ padding: "0 18px" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 8px", scrollbarWidth: "none" }}>
            {qChips.map((chip) => {
              const active = quick === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => setQuick(active ? "" : chip.key)}
                  className="text-sm font-semibold whitespace-nowrap border-0 cursor-pointer transition-all active:scale-95"
                  style={{
                    padding: "7px 12px", borderRadius: 999,
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
        </div>

        {/* Search input */}
        {showSearch && (
          <div style={{ padding: "0 18px 12px" }} className="pz-fade-in">
            <input autoFocus type="text" placeholder="Szukaj wydarzeń..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl text-sm font-medium border-0 outline-none" style={{ background: "var(--bg-soft)", color: "var(--ink)" }} />
          </div>
        )}

        {/* Tonight hero — only on clean home */}
        {!quick && !search && !showFilters && (
          <div style={{ marginTop: 6 }}>
            {/* For You / Hero rail — tall cards */}
            <div style={{ margin: "0 -18px" }}>
              <div style={{ display: "flex", gap: 14, padding: "6px 18px 14px", overflowX: "auto", scrollbarWidth: "none" }}>
                {forYou.map((ev, i) => (
                  <a key={ev.id} href={`/event/${ev.id}`} className="block no-underline" style={{ flex: "0 0 220px", borderRadius: 22, overflow: "hidden", position: "relative", height: 280, cursor: "pointer", color: "inherit" }}>
                    {/* Art background */}
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-end p-3" style={{ background: "var(--bg-soft)" }}>
                        <span className="text-5xl">{categoryEmoji[ev.category] ?? "📌"}</span>
                      </div>
                    )}
                    {/* Date badge */}
                    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "white", fontSize: 11, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--hot)", display: "inline-block" }} />
                        {relDay(new Date(ev.startDate))} · {ev.time ?? "cały dzień"}
                      </span>
                    </div>
                    {/* Gradient overlay + title */}
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))", color: "white" }}>
                      <h4 className="font-bold m-0" style={{ fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{ev.title}</h4>
                      <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>{ev.placeName}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Surprise me CTA */}
            <div style={{ padding: "0 18px 14px" }}>
              <button onClick={() => setShowSurprise(true)} style={{ width: "100%", padding: "14px 18px", borderRadius: 18, border: "0.5px dashed var(--ink-5)", background: "transparent", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.01em" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4v10m0 0a4 4 0 0 1-4 4M4 10l10-6"/></svg>
                Zaskocz mnie — losowy plan
              </button>
            </div>

            {/* For You header + rail */}
            <div style={{ padding: "6px 18px 0" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 className="font-bold m-0" style={{ fontSize: 22, letterSpacing: "-0.025em" }}>Pod Ciebie</h2>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ink-4)" }}>Top z tygodnia</span>
              </div>
              {/* For You horizontal scroll */}
              <div style={{ margin: "0 -18px" }}>
                <div style={{ display: "flex", gap: 14, padding: "6px 18px 14px", overflowX: "auto", scrollbarWidth: "none" }}>
                  {forYou.map((ev, i) => {
                    const friendsList = [{ name: "A" }, { name: "K" }];
                    return (
                      <a key={ev.id} href={`/event/${ev.id}`} className="block no-underline shrink-0" style={{ width: 220, borderRadius: 22, overflow: "hidden", background: "var(--bg-elev)", border: "0.5px solid var(--line)", cursor: "pointer", color: "inherit" }}>
                        <div style={{ height: 120, overflow: "hidden", background: "var(--bg-soft)" }}>
                          {ev.imageUrl ? <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="flex items-end p-2 h-full"><span className="text-3xl">{categoryEmoji[ev.category] ?? "📌"}</span></div>}
                        </div>
                        <div style={{ padding: "10px 12px 12px" }}>
                          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ink-4)" }}>{relDay(new Date(ev.startDate))} · {ev.time ?? "cały dzień"}</span>
                          <h4 className="font-bold text-sm leading-snug mt-1 m-0 line-clamp-2">{ev.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <AvStackInline size={18} names={friendsList.map(() => "A")} />
                            <HeatMeter score={ev.score} />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All events */}
        <div style={{ padding: "8px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 className="font-bold m-0" style={{ fontSize: 22, letterSpacing: "-0.025em" }}>
              {quick || search || showFilters ? "Wyniki" : "Wszystko, co się dzieje"}
            </h2>
            <span className="tabular-nums text-xs font-semibold" style={{ color: "var(--ink-4)" }}>{filtered.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={ev} saved={savedIds.includes(ev.id)} onSave={() => toggleSave(ev.id)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <div className="text-4xl mb-2 leading-none" style={{ fontFamily: "var(--font-display)" }}>nic</div>
                <p style={{ color: "var(--ink-3)", fontSize: 14, margin: 0 }}>Spróbuj zluzować filtry, w mieście jest więcej życia.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSurprise && (
        <SurpriseModal events={events} onPick={(ev) => { window.location.href = `/event/${ev.id}`; }} onClose={() => setShowSurprise(false)} />
      )}
    </>
  );
}

function AvStackInline({ size, names: _names }: { size: number; names: string[] }) {
  return (
    <span className="inline-flex items-center">
      <span className="rounded-full inline-flex items-center justify-center font-bold text-white shrink-0" style={{ width: size, height: size, background: "#FF6B2C", fontSize: size * 0.45, border: "1.5px solid var(--bg-elev)" }}>A</span>
      <span className="rounded-full inline-flex items-center justify-center font-bold text-white shrink-0" style={{ width: size, height: size, background: "#6E3DFF", fontSize: size * 0.45, border: "1.5px solid var(--bg-elev)", marginLeft: -6 }}>K</span>
    </span>
  );
}
