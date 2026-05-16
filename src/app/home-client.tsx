"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { EventData } from "@/lib/data";
import { PL_DAY_FULL, fmtFullDate, relDay } from "@/lib/date";
import EventCard from "@/components/event-card";
import EventArt from "@/components/event-art";
import SurpriseModal from "@/components/surprise-modal";
import TonightHero from "@/components/tonight-hero";
import NearbyNow from "@/components/nearby-now";
import BudgetChips, { type Budget } from "@/components/budget-chips";
import FiltersSheet, { type ActiveFilters } from "@/components/filters-sheet";
import SearchOverlay from "@/components/search-overlay";
import Toast from "@/components/toast";
import EmptyState from "@/components/empty-state";
import TiltCard from "@/components/tilt-card";
import { SearchIcon, FilterIcon, ShuffleIcon } from "@/components/icons";
import { DUR } from "@/lib/duration";
import { categoryGradient } from "@/lib/visuals";

export default function HomeClient({
  initialEvents,
  initialTotal,
}: {
  initialEvents: EventData[];
  initialTotal: number;
}) {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<Budget>(null);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<EventData[] | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    category: [], district: [], vibe: [],
  });

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    params.set("sort", "score");
    if (search) params.set("q", search);
    if (quick) params.set("quick", quick);
    if (budget) params.set("budget", budget);
    for (const c of activeFilters.category) params.append("category", c);
    for (const d of activeFilters.district) params.append("district", d);
    for (const v of activeFilters.vibe) params.append("vibe", v);
    return params.toString();
  };

  const fetchEvents = (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    fetch(`/api/events?${buildQuery()}`, { signal }).then((r) => {
      if (!r.ok) throw new Error("Błąd ładowania");
      return r.json();
    }).then((d) => {
      if (d.events) setEvents(d.events);
      setTotal(d.total ?? d.events?.length ?? 0);
      setLoading(false);
    }).catch((e) => {
      if (e?.name === "AbortError") return;
      console.error("home fetch failed", e);
      setError("Nie udało się załadować wydarzeń");
      setLoading(false);
    });
  };

  // Skip the very first run — initialEvents already covers the default view.
  const firstRun = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const ctrl = new AbortController();
    fetchEvents(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, search, budget, activeFilters]);

  const { data: session } = useSession();

  // Fetch personalized recommendations for logged-in users
  useEffect(() => {
    if (!session?.user) return;
    const ctrl = new AbortController();
    fetch("/api/events?recommended=true&limit=6", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { if (d.recommended) setRecommended(d.recommended); })
      .catch(() => {});
    return () => ctrl.abort();
  }, [session]);


  // Scroll progress bar
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !progressRef.current) return;
    const onScroll = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      progressRef.current!.style.transform = `scaleX(${Math.min(pct, 1)})`;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const today = new Date();
  const forYou = useMemo(
    () => {
      if (recommended && recommended.length > 0) return recommended as EventData[];
      return [...events].sort((a, b) => b.score - a.score).slice(0, 5);
    },
    [events, recommended],
  );

  const activeCount = activeFilters.category.length + activeFilters.district.length + activeFilters.vibe.length;
  const cleanHome = !quick && !search && activeCount === 0 && !budget;

  const router = useRouter();
  const openEvent = (ev: EventData) => { router.push(`/event/${ev.id}`); };
  const toggleSave = async (id: string) => {
    if (!session?.user) { router.push("/login"); return; }
    const isSaved = savedIds.includes(id);
    if (!isSaved) {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": document.cookie.split(";").map(c => c.trim()).find(r => r.startsWith("csrf-token="))?.split("=").slice(1).join("=") ?? "" },
        body: JSON.stringify({ eventId: id, status: "SAVED" }),
      });
      setToast("Zapisano ✅");
      setTimeout(() => { router.push("/lista"); }, DUR.reveal);
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
    <div className="pz-scroll" ref={containerRef} style={{ position: "absolute", inset: 0, paddingBottom: "calc(76px + var(--safe-b))" }}>
      <div className="pz-scroll-progress" ref={progressRef} />
      {/* Header */}
      <div style={{ padding: "calc(16px + var(--safe-t)) 18px 6px" }}>
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
            <button key={o.v} className="pz-chip pz-chip-spring" aria-pressed={quick === o.v}
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
          <button onClick={() => setSurpriseOpen(true)} className="pz-btn ghost" style={{
            width: "100%", height: 50, fontSize: "var(--text-sm)",
            border: "0.5px solid var(--ink-4)", background: "var(--bg-soft)",
          }}>
            <ShuffleIcon size={16} />
            Zaskocz mnie — losowy plan
          </button>
        </div>
      )}

      {cleanHome && forYou.length > 0 && (
        <div style={{ padding: "6px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 className="pz-h" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>
              Polecane dla Ciebie
            </h2>
          </div>
          <div style={{ margin: "0 -18px" }}>
            <div style={{ display: "flex", gap: 12, padding: "0 18px 14px", overflowX: "auto", paddingRight: 36 }}>
              {forYou.map((ev, i) => (
                <TiltCard key={ev.id}>
                  <div
                  onClick={() => openEvent(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEvent(ev); } }}
                  style={{
                    flex: "0 0 min(200px, 52vw)", borderRadius: 22, overflow: "hidden",
                    position: "relative", height: "min(200px, 52vw)", cursor: "pointer",
                    transition: "transform 0.2s var(--ease-out-quart), box-shadow 0.2s var(--ease-out-quart)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  className="pz-section-reveal"
                >
                  <EventArt event={ev} height={200} forceArt={!ev.imageUrl} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: categoryGradient(ev.category),
                  }}>
                    <div style={{ position: "absolute", left: 12, bottom: 12, right: 12 }}>
                      <h3 className="pz-h" style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</h3>
                      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 500, color: "white" }}>{relDay(new Date(ev.startDate))} · {ev.time ?? "—"}</div>
                    </div>
                  </div>
                  </div>
                </TiltCard>
              ))}
              <div onClick={() => { setQuick(null); setSearch(""); setBudget(null); setActiveFilters({ category: [], district: [], vibe: [] }); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQuick(null); setSearch(""); setBudget(null); setActiveFilters({ category: [], district: [], vibe: [] }); } }} style={{ flex: "0 0 120px", borderRadius: 22, height: "min(200px, 52vw)", background: "var(--bg-soft)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 0.2s var(--ease-out-quart)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 99, background: "var(--ink)", color: "var(--bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>→</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>Zobacz<br />wszystko</span>
              </div>
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
          }}>{total}</span>
        </div>
        <div className="pz-feed-grid pz-event-grid" style={{ display: "grid", gap: 14, containerType: "inline-size" }}>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-${i}`} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)" }}>
              <div className="pz-skeleton pz-skeleton-breath" style={{ height: 132 }} />
              <div className="pz-skeleton pz-skeleton-breath" style={{ height: 14, width: "60%" }} />
              <div className="pz-skeleton pz-skeleton-breath" style={{ height: 18, width: "90%" }} />
              <div className="pz-skeleton pz-skeleton-breath" style={{ height: 14, width: "70%" }} />
            </div>
          )) : events.map((ev, i) => (
              <TiltCard key={ev.id}>
                <div style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                  <EventCard event={ev}
                             onOpen={() => openEvent(ev)}
                             onSave={() => toggleSave(ev.id)}
                             saved={savedIds.includes(ev.id)}
                             className="pz-card-stagger" />
                </div>
              </TiltCard>
          ))}
          {error && (
            <div style={{ gridColumn: "1 / -1", padding: "40px 16px", textAlign: "center" }}>
              <p style={{ color: "var(--ink-3)", fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>{error}</p>
              <button onClick={() => fetchEvents()} className="pz-btn primary" style={{ height: 44, fontSize: 13 }}>Spróbuj ponownie</button>
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <EmptyState emoji="🔍" title="Brak wydarzeń" subtitle="Spróbuj poluzować filtry — w mieście dzieje się więcej." />
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
          onPick={(ev) => { router.push(`/event/${ev.id}`); }}
          onClose={() => setSurpriseOpen(false)}
        />
      )}

      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}
