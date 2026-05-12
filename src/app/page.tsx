"use client";

import { useState, useMemo, useEffect } from "react";
import { EventData, categoryEmoji } from "@/lib/data";
import EventCard from "@/components/event-card";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import SurpriseModal from "@/components/surprise-modal";
import { SearchIcon, FilterIcon } from "@/components/icons";

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
  const now = new Date(); now.setHours(0, 0, 0, 0);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [goingIds, setGoingIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [surpriseOpen, setSurpriseOpen] = useState(false);

  useEffect(() => {
    fetch("/api/events?limit=100").then((r) => r.json()).then((d) => {
      if (d.events) setEvents(d.events);
    });
  }, []);

  const today = new Date();
  const forYou = useMemo(() => [...events].sort((a, b) => b.score - a.score).slice(0, 5), [events]);

  const filtered = useMemo(() => {
    let evs = events.slice().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    if (search) {
      const q = search.toLowerCase();
      evs = evs.filter((e) => e.title.toLowerCase().includes(q) || e.placeName.toLowerCase().includes(q));
    }
    const now = new Date();
    if (quick === "today") evs = evs.filter((e) => new Date(e.startDate).toDateString() === now.toDateString());
    if (quick === "tonight") evs = evs.filter((e) => { const s = new Date(e.startDate); return s.toDateString() === now.toDateString() && s.getHours() >= 18; });
    if (quick === "tomorrow") { const t = new Date(now); t.setDate(t.getDate() + 1); evs = evs.filter((e) => new Date(e.startDate).toDateString() === t.toDateString()); }
    if (quick === "weekend") evs = evs.filter((e) => { const d = new Date(e.startDate); const diff = Math.round((d.getTime() - now.getTime()) / 86400000); return diff >= 0 && diff <= 5 && (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0); });
    if (quick === "week") evs = evs.filter((e) => (new Date(e.startDate).getTime() - now.getTime()) / 86400000 < 7);
    if (budget === "free") evs = evs.filter((e) => e.price === "0 zł" || e.price === "Bezpłatny");
    return evs;
  }, [events, search, quick, budget]);

  const activeCount = 0;
  const openEvent = (ev: EventData) => { window.location.href = `/event/${ev.id}`; };
  const toggleSave = (id: string) => setSavedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  const toggleGoing = (id: string) => setGoingIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ padding: "54px 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="pz-eyebrow" style={{ marginBottom: 6 }}>
              {PL_DAY_FULL[today.getDay()]}, {fmtFullDate(today)}
            </div>
            <h1 className="pz-h" style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 0.95 }}>
              Co dziś<br />w Poznaniu.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Szukaj" style={{
              width: 40, height: 40, borderRadius: 99, border: 0,
              background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><SearchIcon size={20} /></button>
            <button onClick={() => setFiltersOpen(!filtersOpen)} aria-label="Filtry" style={{
              width: 40, height: 40, borderRadius: 99, border: 0,
              background: activeCount ? "var(--ink)" : "var(--bg-soft)",
              color: activeCount ? "var(--bg)" : "var(--ink)",
              cursor: "pointer", position: "relative",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <FilterIcon size={20} />
              {activeCount > 0 && (
                <span style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 99, background: "var(--hot)", color: "white", fontSize: 9.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{activeCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search input */}
      {searchOpen && (
        <div style={{ padding: "0 18px 12px" }} className="pz-fade-in">
          <input autoFocus type="text" placeholder="Szukaj wydarzeń..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 18, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)" }} />
        </div>
      )}

      {/* Quick chips */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 8px" }}>
          {["today", "tonight", "tomorrow", "weekend", "week"].map((k) => {
            const labels: Record<string, string> = { today: "Dziś", tonight: "Wieczorem", tomorrow: "Jutro", weekend: "Weekend", week: "Ten tydzień" };
            const active = quick === k;
            return (
              <button key={k} className="pz-chip" data-active={active}
                      onClick={() => setQuick(quick === k ? null : k)}>
                {labels[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tonight hero + featured content */}
      {!quick && !search && activeCount === 0 && (
        <div style={{ marginTop: 6 }}>
          {/* Tonight Hero — swipeable event cards */}
          <div style={{ margin: "0 -18px" }}>
            <div style={{ display: "flex", gap: 14, padding: "6px 18px 14px", overflowX: "auto" }}>
              {forYou.map((ev, i) => (
                <div key={ev.id} onClick={() => openEvent(ev)} style={{
                  flex: "0 0 220px", borderRadius: 22, overflow: "hidden",
                  position: "relative", height: 280, cursor: "pointer",
                }} className="pz-pop">
                  {ev.imageUrl ? (
                    <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-end p-3" style={{ background: "var(--bg-soft)" }}>
                      <span className="text-5xl">{categoryEmoji[ev.category] ?? "📌"}</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 6 }}>
                    <span className="pz-pill solid" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "white", fontSize: 11 }}>
                      <span className="pz-dot" style={{ color: "var(--hot)" }} />
                      {relDay(new Date(ev.startDate))} · {ev.time ?? "cały dzień"}
                    </span>
                  </div>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))", color: "white" }}>
                    <h4 className="pz-h" style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{ev.title}</h4>
                    <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>{ev.placeName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Surprise me CTA */}
          <div style={{ padding: "0 18px 14px" }}>
            <button onClick={() => setSurpriseOpen(true)} style={{
              width: "100%", padding: "14px 18px", borderRadius: 18,
              border: "0.5px dashed var(--ink-5)", background: "transparent",
              color: "var(--ink)", fontSize: 14, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer", letterSpacing: "-0.01em",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10m0 0a4 4 0 0 1-4 4M4 10l10-6"/></svg>
              Zaskocz mnie — losowy plan
            </button>
          </div>

          {/* For You rail */}
          <div style={{ padding: "6px 18px 0" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 className="pz-h" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Pod Ciebie</h2>
              <span className="pz-eyebrow">Top z tygodnia</span>
            </div>
            <div style={{ margin: "0 -18px" }}>
              <div style={{ display: "flex", gap: 14, padding: "6px 18px 14px", overflowX: "auto" }}>
                {forYou.map((ev, i) => (
                  <div key={ev.id} onClick={() => openEvent(ev)} style={{
                    flex: "0 0 220px", borderRadius: 22, overflow: "hidden",
                    position: "relative", height: 280, cursor: "pointer",
                  }} className="pz-pop">
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-end p-3" style={{ background: "var(--bg-soft)" }}>
                        <span className="text-5xl">{categoryEmoji[ev.category] ?? "📌"}</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", left: 12, top: 12 }}>
                      <span className="pz-pill solid" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "white", fontSize: 11 }}>
                        <span className="pz-dot" style={{ color: "var(--hot)" }} />
                        {relDay(new Date(ev.startDate))} · {ev.time}
                      </span>
                    </div>
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))", color: "white" }}>
                      <h4 className="pz-h" style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{ev.title}</h4>
                      <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>{ev.placeName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All events */}
      <div style={{ padding: "8px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="pz-h" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>
            {quick || search || activeCount ? "Wyniki" : "Wszystko, co się dzieje"}
          </h2>
          <span className="pz-num" style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 600 }}>{filtered.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev}
                       onOpen={() => openEvent(ev)}
                       onSave={() => toggleSave(ev.id)}
                       saved={savedIds.includes(ev.id)}
                       going={goingIds.includes(ev.id)}
                       onGoing={() => toggleGoing(ev.id)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div className="pz-display" style={{ fontSize: 38, lineHeight: 1, marginBottom: 10 }}>nic</div>
              <p style={{ color: "var(--ink-3)", fontSize: 14, margin: 0 }}>Spróbuj zluzować filtry, w mieście jest więcej życia.</p>
            </div>
          )}
        </div>
      </div>

      {surpriseOpen && (
        <SurpriseModal events={events} onPick={(ev) => { window.location.href = `/event/${ev.id}`; }} onClose={() => setSurpriseOpen(false)} />
      )}
    </div>
  );
}
