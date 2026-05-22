"use client";

import { useState, useRef, useCallback } from "react";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CloseIcon, PinIcon } from "@/components/icons";
import { districts } from "@/lib/data";

export interface DistrictVisit {
  district: string;
  label: string;
  count: number;
  events: { date: string; title: string }[];
}

export default function PassportBooklet({
  open, onClose, visits, userName,
}: {
  open: boolean; onClose: () => void;
  visits: DistrictVisit[];
  userName: string;
}) {
  const [page, setPage] = useState(0);
  const [exiting, setExiting] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pageCount = 2 + visits.length + 1; // cover + stats + districts + summary

  const close = () => { setExiting(true); setTimeout(onClose, 350); };
  useEscape(close);
  const focusTrapRef = useFocusTrap(true);

  const goTo = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(pageCount - 1, p)));
  }, [pageCount]);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      goTo(dx < 0 ? page + 1 : page - 1);
    }
    touchStart.current = null;
  };

  if (!open) return null;

  const visitedCount = visits.filter((v) => v.count > 0).length;
  const totalEvents = visits.reduce((s, v) => s + v.count, 0);
  const firstVisit = visits.filter((v) => v.count > 0).sort((a, b) => a.events[0].date.localeCompare(b.events[0].date))[0];

  const pages = [
    // Cover
    { type: "cover" as const, bg: "linear-gradient(135deg, #141E30 0%, #243B55 50%, #1A2A40 100%)" },
    // Stats
    { type: "stats" as const, bg: "linear-gradient(135deg, #1A2A40 0%, #141E30 100%)" },
    // District pages (6)
    ...visits.map((v) => ({
      type: "district" as const, bg: v.count > 0
        ? `linear-gradient(135deg, hsl(${(visits.indexOf(v)) * 50 + 180}, 40%, 18%), hsl(${(visits.indexOf(v)) * 50 + 160}, 50%, 10%))`
        : "linear-gradient(135deg, #1A2A40, #141E30)",
      visit: v,
    })),
    // Summary
    { type: "summary" as const, bg: "linear-gradient(135deg, #141E30 0%, #1A2A40 100%)" },
  ];

  const p = pages[page];

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Paszport POznaj" style={{
      position: "fixed", inset: 0, zIndex: 130, background: "var(--bg)",
      animation: exiting ? "pz-fade-out 0.35s var(--ease-out-quart) both" : "pz-slide-up 0.4s var(--ease-spring) both",
    }}>
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, padding: "calc(14px + var(--safe-t)) 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {pages.map((_, i) => (
            <span key={i} style={{
              width: i === page ? 20 : 6, height: 6, borderRadius: 99,
              background: i <= page ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
              transition: "all 0.3s var(--ease-out-quart)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{page + 1}/{pageCount}</span>
          <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Zamknij" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <CloseIcon size={18} />
          </button>
        </div>
      </div>

      {/* Page content */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={() => goTo(page + 1)} style={{
        position: "absolute", inset: 0, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: p.bg, color: "white", padding: "60px 32px 40px",
      }}>
        {/* Cover */}
        {p.type === "cover" && (
          <div key="cover" style={{ textAlign: "center", animation: "pz-slide-up 0.5s var(--ease-spring) both" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.2)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
              🏛️
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Paszport</div>
            <div className="pz-h" style={{ fontSize: "clamp(32px, 10vw, 48px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 8 }}>POznaj</div>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>{new Date().getFullYear()}</div>
            <div style={{ marginTop: 32, fontSize: 15, fontWeight: 600, opacity: 0.7 }}>{userName}</div>
          </div>
        )}

        {/* Stats */}
        {p.type === "stats" && (
          <div key="stats" style={{ width: "100%", textAlign: "center", animation: "pz-slide-up 0.5s var(--ease-spring) both" }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>Twój paszport w liczbach</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 300, margin: "0 auto" }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.1)" }}>
                <div className="pz-num" style={{ fontSize: "clamp(32px, 10vw, 48px)", fontWeight: 800 }}>{totalEvents}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>wydarzeń</div>
              </div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.1)" }}>
                <div className="pz-num" style={{ fontSize: "clamp(32px, 10vw, 48px)", fontWeight: 800 }}>{visitedCount}/6</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>dzielnic</div>
              </div>
              {firstVisit && (
                <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.1)", gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Pierwsza wizyta</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{firstVisit.events[0].date}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* District stamp page */}
        {p.type === "district" && (
          <div key={`d-${p.visit.district}`} style={{ textAlign: "center", animation: "pz-slide-up 0.5s var(--ease-spring) both" }}>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.4, marginBottom: 8 }}>Dzielnica</div>
            <h2 className="pz-h" style={{ fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 24px" }}>
              {p.visit.label}
            </h2>
            {p.visit.count > 0 ? (
              <>
                {/* Stamp */}
                <div style={{
                  width: 180, height: 180, borderRadius: "50%",
                  border: "3px dashed rgba(255,255,255,0.35)",
                  margin: "0 auto 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.06)",
                  animation: "pz-stamp-in 0.7s var(--ease-out-quart) both",
                  transform: "rotate(-8deg)",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}>POznaj</div>
                  <div className="pz-h" style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, margin: "4px 0" }}>{p.visit.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                    {new Date(p.visit.events[0].date).toLocaleDateString("pl")}
                  </div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
                  {p.visit.count} {p.visit.count === 1 ? "wizyta" : p.visit.count < 5 ? "wizyty" : "wizyt"}
                </div>
                <div style={{ fontSize: 10, opacity: 0.35, marginTop: 12, maxWidth: 260, margin: "12px auto 0" }}>
                  {p.visit.events.slice(0, 3).map((ev) => (
                    <div key={ev.date} style={{ marginTop: 4 }}>{ev.date} — {ev.title.substring(0, 40)}</div>
                  ))}
                  {p.visit.events.length > 3 && <div style={{ marginTop: 4 }}>+{p.visit.events.length - 3} więcej</div>}
                </div>
              </>
            ) : (
              <div style={{ opacity: 0.3 }}>
                <div style={{
                  width: 180, height: 180, borderRadius: "50%",
                  border: "2px dashed rgba(255,255,255,0.2)",
                  margin: "0 auto 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Jeszcze<br />nieodwiedzona</span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24, fontSize: 11, opacity: 0.45 }}>
              <PinIcon size={12} /> {p.visit.label}
            </div>
          </div>
        )}

        {/* Summary */}
        {p.type === "summary" && (
          <div key="summary" style={{ textAlign: "center", animation: "pz-slide-up 0.5s var(--ease-spring) both" }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Paszport wydany przez</div>
            <div className="pz-h" style={{ fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
              POznaj
            </div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📍</div>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.6 }}>{userName}</div>
            <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4 }}>{new Date().getFullYear()}</div>
            <div style={{ marginTop: 24, fontSize: 12, fontWeight: 600, opacity: 0.4 }}>{visitedCount} dzielnic · {totalEvents} wydarzeń</div>
          </div>
        )}

        {/* Swipe hint */}
        {page < pageCount - 1 && (
          <div style={{ position: "absolute", bottom: 32, opacity: 0.3, fontSize: 12 }}>Tapnij lub przesuń →</div>
        )}
      </div>
    </div>
  );
}
