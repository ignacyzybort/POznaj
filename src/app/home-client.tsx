"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { EventData } from "@/lib/data";
import { PL_DAY_FULL, fmtFullDate, relWhen } from "@/lib/date";
import EventCard from "@/components/event-card";
import EventArt from "@/components/event-art";
import SurpriseModal from "@/components/surprise-modal";
import TonightHero from "@/components/tonight-hero";
import NearbyNow from "@/components/nearby-now";
import BudgetChips, { type Budget } from "@/components/budget-chips";
import FiltersSheet, { type ActiveFilters } from "@/components/filters-sheet";
import SearchOverlay from "@/components/search-overlay";
import Toast from "@/components/toast";
import Portal from "@/components/portal";
import EmptyState from "@/components/empty-state";
import TiltCard from "@/components/tilt-card";
import { SearchIcon, FilterIcon, ShuffleIcon } from "@/components/icons";
import { categoryGradient } from "@/lib/visuals";
import { getCsrfToken } from "@/lib/csrf";

export default function HomeClient({
  initialEvents,
  initialTotal,
  initialSavedIds = [],
  initialSavedSlots = {},
}: {
  initialEvents: EventData[];
  initialTotal: number;
  initialSavedIds?: string[];
  initialSavedSlots?: Record<string, string[]>;
}) {
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds);
  const [savedSlots, setSavedSlots] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(Object.entries(initialSavedSlots).map(([id, slots]) => [id, new Set(slots)]))
  );
  const { data: session } = useSession();
  const [budget, setBudget] = useState<Budget>(null);
  const [outdoorOn, setOutdoorOn] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recommended, setRecommended] = useState<EventData[] | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    category: [], district: [], vibe: [],
  });

  const offsetRef = useRef(initialEvents.length);
  const hasMore = events.length < total;

  const buildQuery = (forOffset: number) => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    params.set("sort", "score");
    params.set("offset", String(forOffset));
    if (search) params.set("q", search);
    if (quick) params.set("quick", quick);
    if (budget) params.set("budget", budget);
    if (outdoorOn) params.set("outdoor", "true");
    for (const c of activeFilters.category) params.append("category", c);
    for (const d of activeFilters.district) params.append("district", d);
    for (const v of activeFilters.vibe) params.append("vibe", v);
    return params.toString();
  };

  const hydrateSaved = (ids: string[]) => {
    if (!session?.user || ids.length === 0) return;
    fetch(`/api/attendance?eventIds=${encodeURIComponent(ids.slice(0, 200).join(","))}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const savedRows = (d?.attendance ?? []).filter(
          (row: { status: string }) => row.status === "SAVED"
        ) as { eventId: string; timeSlot: string }[];
        if (savedRows.length === 0) return;

        setSavedIds((prev) => Array.from(new Set([...prev, ...savedRows.map((r) => r.eventId)])));
        setSavedSlots((prev) => {
          const next = { ...prev };
          for (const row of savedRows) {
            if (!row.timeSlot) continue;
            next[row.eventId] = new Set([...(next[row.eventId] ?? []), row.timeSlot]);
          }
          return next;
        });
      })
      .catch(() => {});
  };

  const fetchEvents = (signal?: AbortSignal, append = false) => {
    if (append) setLoadingMore(true);
    else { setLoading(true); offsetRef.current = 0; }
    setError(null);
    fetch(`/api/events?${buildQuery(offsetRef.current)}`, { signal }).then((r) => {
      if (!r.ok) throw new Error("Błąd ładowania");
      return r.json();
    }).then((d) => {
      const fetched = d.events?.length ?? 0;
      if (append) {
        setEvents((prev) => [...prev, ...(d.events ?? [])]);
        offsetRef.current += fetched;
      } else {
        setEvents(d.events ?? []);
        offsetRef.current = fetched;
      }
      hydrateSaved((d.events ?? []).map((e: EventData) => e.id));
      setTotal(d.total ?? 0);
      setLoading(false);
      setLoadingMore(false);
    }).catch((e) => {
      if (e?.name === "AbortError") return;
      console.error("home fetch failed", e);
      setError("Ups, coś się zacięło — spróbuj jeszcze raz");
      setLoading(false);
      setLoadingMore(false);
    });
  };

  // Skip the very first run — initialEvents already covers the default view.
  const firstRun = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const ctrl = new AbortController();
    fetchEvents(ctrl.signal, false);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, search, budget, outdoorOn, activeFilters]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const ctrl = new AbortController();
          fetchEvents(ctrl.signal, true);
        }
      },
      { root: containerRef.current, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore]);

  // Hydrate saved state once the session is known (and for events loaded client-side)
  useEffect(() => {
    if (!session?.user) return;
    hydrateSaved(events.map((e) => e.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Fetch personalized recommendations for logged-in users
  useEffect(() => {
    if (!session?.user) return;
    const ctrl = new AbortController();
    fetch("/api/events?recommended=true&limit=6", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.recommended) {
          setRecommended(d.recommended);
          hydrateSaved((d.recommended as EventData[]).map((e) => e.id));
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);


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
  const cleanHome = !quick && !search && activeCount === 0 && !budget && !outdoorOn;

  const router = useRouter();
  const openEvent = (ev: EventData) => { router.push(`/event/${ev.id}`); };
  const toggleSave = async (id: string, timeSlot?: string) => {
    if (!session?.user) { router.push("/login"); return; }
    const body: Record<string, unknown> = { eventId: id, status: "SAVED" };
    if (timeSlot) body.timeSlot = timeSlot;

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (timeSlot) {
      setSavedSlots((prev) => {
        const next = { ...prev };
        const slots = new Set(prev[id] ?? []);
        if (data.status === null) {
          slots.delete(timeSlot);
        } else {
          slots.add(timeSlot);
        }
        next[id] = slots;
        return next;
      });
    } else {
      const isSaved = savedIds.includes(id);
      if (data.status === null) {
        setSavedIds((prev) => prev.filter((v) => v !== id));
      } else {
        setSavedIds((prev) => [...prev, id]);
      }
      if (!isSaved) setToast("Zapisano");
    }
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
      <div className="pz-page">
      {/* Masthead */}
      <div className="pz-masthead" style={{ margin: "calc(14px + var(--safe-t)) 18px 14px" }}>
        <div className="pz-masthead-meta">
          <span className="pz-sans-display" style={{ fontSize: 17, color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </span>
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
        <span className="pz-eyebrow" style={{ fontSize: 9.5, display: "block", marginBottom: 8 }}>
          {PL_DAY_FULL[today.getDay()]}, {fmtFullDate(today)}
        </span>
        <h1>
          Poznań nie<br /><em>zasypia.</em>
        </h1>
        <div className="pz-masthead-foot">
          <span className="pz-issue-tag">№ {Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)}</span>
          <span className="pz-eyebrow">{total} wydarzeń w mieście</span>
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
      <div style={{ padding: "0 18px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <BudgetChips active={budget} onToggle={setBudget} />
        <button className="pz-chip pz-chip-spring" aria-pressed={outdoorOn}
                data-active={outdoorOn ? "true" : undefined}
                onClick={() => setOutdoorOn(!outdoorOn)}>
          Na świeżym
        </button>
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
        <div style={{ padding: "12px 0 6px" }}>
          <div style={{ padding: "0 18px", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 className="pz-display pz-section-head" style={{ margin: 0, fontSize: 26, letterSpacing: "-0.03em", lineHeight: 1 }}>Polecane dla Ciebie</h2>
            <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>dla Ciebie</span>
          </div>
          <div style={{ display: "flex", gap: 14, padding: "0 18px 14px", overflowX: "auto", scrollSnapType: "x mandatory" }}>
            {forYou.map((ev) => (
              <TiltCard key={ev.id}>
                <div
                onClick={() => openEvent(ev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEvent(ev); } }}
                style={{
                  width: "min(312px, 85vw)", flexShrink: 0, borderRadius: 22, overflow: "hidden",
                  position: "relative", height: "min(200px, 52vw)", cursor: "pointer",
                  transition: "transform 0.2s var(--ease-out-quart), box-shadow 0.2s var(--ease-out-quart)",
                  boxShadow: "var(--shadow-sm)", scrollSnapAlign: "start",
                }}
                className="pz-section-reveal"
              >
                <EventArt event={ev} height={200} forceArt={!ev.imageUrl} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: categoryGradient(ev.category),
                }}>
                  <div style={{ position: "absolute", left: 12, bottom: 12, right: 12 }}>
                    <h3 className="pz-display" style={{ margin: 0, fontSize: 21, fontWeight: 400, letterSpacing: "-0.025em", lineHeight: 1.02, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</h3>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 500, color: "white" }}>{relWhen(ev.startDate, ev.endDate)} · {ev.time ?? "—"}</div>
                  </div>
                </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      )}

      {/* All events */}
      <div style={{ padding: "8px 18px 0" }}>
        <div style={{
          display: "flex", alignItems: "baseline",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <h2 className="pz-display pz-section-head" style={{
            margin: 0, fontSize: 26, letterSpacing: "-0.03em", lineHeight: 1,
          }}>{quick || search || activeCount || budget || outdoorOn ? "Wyniki" : "Wszystko, co się dzieje"}</h2>
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
              <TiltCard key={ev.id} maxTilt={4}>
                <div style={{ '--i': Math.min(i, 8), height: "100%" } as React.CSSProperties}>
                   <EventCard event={ev}
                              onOpen={() => openEvent(ev)}
                              onSave={(ts) => toggleSave(ev.id, ts)}
                              saved={savedIds.includes(ev.id)}
                              savedSlots={[...(savedSlots[ev.id] ?? [])]}
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
            <EmptyState title="Brak wydarzeń" subtitle="Spróbuj poluzować filtry — w mieście dzieje się więcej." />
          )}
        </div>
        {hasMore && <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} />}
        {loadingMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0 40px" }}>
            <span className="pz-spinner" style={{ width: 24, height: 24 }} />
          </div>
        )}
      </div>

      </div>

      <Portal>
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

      </Portal>

      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}
