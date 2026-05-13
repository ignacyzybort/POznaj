"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { EventData } from "@/lib/data";
import { PL_DAY_FULL, PL_MONTH_FULL, fmtFullDate, fmtShortDate, relDay } from "@/lib/date";
import EventCard from "@/components/event-card";
import EventArt from "@/components/event-art";
import SurpriseModal from "@/components/surprise-modal";
import TonightHero from "@/components/tonight-hero";
import NearbyNow from "@/components/nearby-now";
import BudgetChips, { type Budget } from "@/components/budget-chips";
import FiltersSheet, { type ActiveFilters } from "@/components/filters-sheet";
import SearchOverlay from "@/components/search-overlay";
import Toast from "@/components/toast";
import { SearchIcon, FilterIcon, ShuffleIcon } from "@/components/icons";
import { DUR } from "@/lib/duration";

function priceNum(p?: string): number {
  if (!p) return 0;
  const n = parseInt(p.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
function isFree(p?: string): boolean {
  if (!p) return false;
  const x = p.toLowerCase();
  return x.includes("free") || x.includes("wolny") || x.includes("bezpł") || x.startsWith("0");
}

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<Budget>(null);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    category: [], district: [], vibe: [],
  });

  const fetchEvents = () => {
    setLoading(true);
    setError(null);
    fetch("/api/events?limit=100").then((r) => {
      if (!r.ok) throw new Error("Błąd ładowania");
      return r.json();
    }).then((d) => {
      if (d.events) setEvents(d.events);
      setLoading(false);
    }).catch(() => {
      setError("Nie udało się załadować wydarzeń");
      setLoading(false);
    });
  };

  useEffect(() => { fetchEvents(); }, []);

  const today = new Date();
  const forYou = useMemo(
    () => [...events].sort((a, b) => b.score - a.score).slice(0, 5),
    [events],
  );

  const filtered = useMemo(() => {
    let evs = events.slice().sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
    if (search) {
      const q = search.toLowerCase();
      evs = evs.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.placeName.toLowerCase().includes(q) ||
        e.district.toLowerCase().includes(q));
    }
    if (activeFilters.category.length) {
      evs = evs.filter((e) => activeFilters.category.includes(e.category));
    }
    if (activeFilters.district.length) {
      evs = evs.filter((e) => activeFilters.district.includes(e.district));
    }
    if (activeFilters.vibe.length) {
      evs = evs.filter((e) => e.vibes?.some((v) => activeFilters.vibe.includes(v)));
    }
    if (budget === "free") evs = evs.filter((e) => isFree(e.price));
    if (budget === "cheap") evs = evs.filter((e) => isFree(e.price) || priceNum(e.price) <= 45);
    if (budget === "student") evs = evs.filter((e) => isFree(e.price) || priceNum(e.price) <= 60);
    const now = new Date();
    if (quick === "today") {
      evs = evs.filter((e) => new Date(e.startDate).toDateString() === now.toDateString());
    }
    if (quick === "tonight") {
      evs = evs.filter((e) => {
        const s = new Date(e.startDate);
        return s.toDateString() === now.toDateString() && s.getHours() >= 18;
      });
    }
    if (quick === "tomorrow") {
      const t = new Date(now); t.setDate(t.getDate() + 1);
      evs = evs.filter((e) => new Date(e.startDate).toDateString() === t.toDateString());
    }
    if (quick === "weekend") {
      evs = evs.filter((e) => {
        const d = new Date(e.startDate);
        const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
        return diff >= 0 && diff <= 5 && (d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0);
      });
    }
    if (quick === "week") {
      evs = evs.filter((e) => (new Date(e.startDate).getTime() - now.getTime()) / 86400000 < 7);
    }
    return evs;
  }, [events, search, quick, budget, activeFilters]);

  const activeCount = activeFilters.category.length + activeFilters.district.length + activeFilters.vibe.length;
  const cleanHome = !quick && !search && activeCount === 0 && !budget;

  const { data: session } = useSession();
  const openEvent = (ev: EventData) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => { window.location.href = `/event/${ev.id}`; });
    } else {
      window.location.href = `/event/${ev.id}`;
    }
  };
  const toggleSave = async (id: string) => {
    if (!session?.user) { window.location.href = "/login"; return; }
    const isSaved = savedIds.includes(id);
    if (!isSaved) {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, status: "SAVED" }),
      });
      setToast("Zapisano ✅");
      setTimeout(() => { window.location.href = "/lista"; }, DUR.reveal);
    }
    setSavedIds((prev) =>
      isSaved ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };


  const toggleFilter = (kind: keyof ActiveFilters, value: string) => {
    setActiveFilters((prev) => {
      const list = prev[kind];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [kind]: next };
    });
  };
  const clearFilters = () => setActiveFilters({ category: [], district: [], vibe: [] });

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: "54px 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
                poznaj<span style={{ color: "var(--sage)" }}>.</span>
              </span>
              <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>
                {PL_DAY_FULL[today.getDay()]}, {fmtFullDate(today)}
              </span>
            </div>
            <h1 className="pz-h" style={{
              margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.035em",
              lineHeight: 0.95,
            }}>
              Co dziś<br />w Poznaniu.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSearchOpen(true)} aria-label="Szukaj" style={{
              width: 44, height: 44, borderRadius: 99, border: 0,
              background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><SearchIcon size={20} /></button>
            <button onClick={() => setFiltersOpen(true)} aria-label="Filtry" style={{
              width: 44, height: 44, borderRadius: 99, border: 0,
              background: activeCount ? "var(--ink)" : "var(--bg-soft)",
              color: activeCount ? "var(--bg)" : "var(--ink)",
              cursor: "pointer", position: "relative",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <FilterIcon size={20} />
              {activeCount > 0 && (
                <span style={{
                  position: "absolute", top: -2, right: -2, minWidth: 16, height: 16,
                  borderRadius: 99, background: "var(--hot)", color: "white",
                  fontSize: 9.5, fontWeight: 700, display: "inline-flex",
                  alignItems: "center", justifyContent: "center", padding: "0 4px",
                }}>{activeCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick chips */}
      <div style={{ padding: "0 18px" }}>
        <div className="pz-scroll" style={{
          display: "flex", gap: 8, overflowX: "auto",
          padding: "4px 18px 8px", margin: "0 -18px",
        }}>
          {[
            { v: "today", label: "Dziś" },
            { v: "tonight", label: "Wieczorem" },
            { v: "tomorrow", label: "Jutro" },
            { v: "weekend", label: "Weekend" },
            { v: "week", label: "Ten tydzień" },
          ].map((o) => (
            <button key={o.v} className="pz-chip"
                    data-active={quick === o.v ? "true" : undefined}
                    onClick={() => setQuick(quick === o.v ? null : o.v)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tonight hero + NearbyNow — only on clean home */}
      {cleanHome && forYou.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <TonightHero events={forYou} onOpen={openEvent} />
          <NearbyNow />
        </div>
      )}

      {/* Budget chips */}
      <div style={{ padding: "0 18px 10px" }}>
        <BudgetChips active={budget} onToggle={setBudget} />
      </div>

      {/* Surprise me CTA */}
      {cleanHome && (
        <div style={{ padding: "0 18px 14px" }}>
          <button onClick={() => setSurpriseOpen(true)} style={{
            width: "100%", padding: "14px 18px", borderRadius: 18,
            border: "0.5px dashed var(--ink-5)", background: "transparent",
            color: "var(--ink)", fontSize: 14, fontWeight: 600,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: "pointer", letterSpacing: "-0.01em",
          }}>
            <ShuffleIcon size={16} />
            Zaskocz mnie — losowy plan
          </button>
        </div>
      )}

      {/* For You rail */}
      {cleanHome && forYou.length > 0 && (
        <div className="pz-section-reveal" style={{ padding: "6px 18px 0" }}>
          <div style={{
            display: "flex", alignItems: "baseline",
            justifyContent: "space-between", marginBottom: 4,
          }}>
            <h2 className="pz-h" style={{
              margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em",
            }}>Pod Ciebie</h2>
            <span className="pz-eyebrow">Top z tygodnia</span>
          </div>
          <div style={{ margin: "0 -18px" }}>
            <div className="pz-scroll" style={{
              display: "flex", gap: 14,
              padding: "6px 18px 14px", overflowX: "auto",
            }}>
              {forYou.map((ev, i) => (
                <div key={ev.id} onClick={() => openEvent(ev)} className="pz-pop" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEvent(ev); } }} style={{
                  flex: "0 0 220px", borderRadius: 22, overflow: "hidden",
                  position: "relative", height: 280, cursor: "pointer",
                }}>
                  <EventArt event={ev} height={280} style={i === 0 ? "collage" : (i % 2 === 0 ? "gradient" : "collage")} forceArt={!ev.imageUrl} />
                  <div style={{ position: "absolute", left: 12, top: 12 }}>
                    <span className="pz-pill solid" style={{
                      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                      color: "white", fontSize: 11,
                    }}>
                      <span className="pz-dot" style={{ color: "var(--hot)" }} />
                      {relDay(new Date(ev.startDate))} · {ev.time ?? "—"}
                    </span>
                  </div>
                  <div style={{
                    position: "absolute", left: 0, right: 0, bottom: 0, padding: 14,
                    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.65))",
                    color: "white",
                  }}>
                    <h4 className="pz-h" style={{
                      margin: 0, fontSize: 17, fontWeight: 700,
                      letterSpacing: "-0.02em", lineHeight: 1.15,
                    }}>{ev.title}</h4>
                    <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>
                      {ev.placeName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All events */}
      <div style={{ padding: "8px 18px 0" }}>
        <div style={{
          display: "flex", alignItems: "baseline",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <h2 className="pz-h" style={{
            margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em",
          }}>{quick || search || activeCount || budget ? "Wyniki" : "Wszystko, co się dzieje"}</h2>
          <span className="pz-num" style={{
            fontSize: 12, color: "var(--ink-4)", fontWeight: 600,
          }}>{filtered.length}</span>
        </div>
        <div className="pz-feed-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, containerType: "inline-size" }}>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-${i}`} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)" }}>
              <div className="pz-skeleton" style={{ height: 132 }} />
              <div className="pz-skeleton" style={{ height: 14, width: "60%" }} />
              <div className="pz-skeleton" style={{ height: 18, width: "90%" }} />
              <div className="pz-skeleton" style={{ height: 14, width: "70%" }} />
            </div>
          )) : filtered.map((ev, i) => {
            const isFeature = (i > 0 && i % 4 === 3);
            return isFeature ? (
              <React.Fragment key={ev.id}>
                <div onClick={() => openEvent(ev)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEvent(ev); } }}
                  className="pz-card-stagger pz-section-reveal"
                  style={{ '--i': Math.min(i, 8) as number, gridColumn: "1 / -1", borderRadius: 22, overflow: "hidden", position: "relative", height: 200, cursor: "pointer" } as React.CSSProperties}>
                  <EventArt event={ev} height={200} forceArt={!ev.imageUrl} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, transparent 60%)", padding: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <span className="pz-pill solid" style={{ alignSelf: "flex-start", marginBottom: 8, fontSize: 11 }}>{ev.category}</span>
                    <h3 style={{ margin: 0, color: "white", fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{ev.title}</h3>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{ev.placeName} · {ev.time ?? ""}</p>
                  </div>
                </div>
              </React.Fragment>
            ) : (
              <div key={ev.id} style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <EventCard event={ev}
                           onOpen={() => openEvent(ev)}
                           onSave={() => toggleSave(ev.id)}
                           saved={savedIds.includes(ev.id)}
                           className="pz-card-stagger" />
              </div>
            );
          })}
          {error && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 16px", textAlign: "center" }}>
              <p style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{error}</p>
              <button onClick={fetchEvents} className="pz-btn primary" style={{ height: 44, fontSize: 13 }}>Spróbuj ponownie</button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div className="pz-display" style={{ fontSize: 38, lineHeight: 1, marginBottom: 10 }}>nic</div>
              <p style={{ color: "var(--ink-3)", fontSize: 14, margin: 0 }}>
                Spróbuj zluzować filtry, w mieście jest więcej życia.
              </p>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          events={events}
          initial={search}
          onCommit={setSearch}
          onOpen={openEvent}
        />
      )}

      {filtersOpen && (
        <FiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          active={activeFilters}
          onToggle={toggleFilter}
          onClear={clearFilters}
        />
      )}

      {surpriseOpen && (
        <SurpriseModal
          events={events}
          onPick={(ev) => { window.location.href = `/event/${ev.id}`; }}
          onClose={() => setSurpriseOpen(false)}
        />
      )}

      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}
