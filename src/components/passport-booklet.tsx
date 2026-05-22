"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CloseIcon, BackIcon, ArrowIcon, PinIcon } from "@/components/icons";
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
  const [coverOpened, setCoverOpened] = useState(false);
  const [page, setPage] = useState(0);
  const [exiting, setExiting] = useState(false);
  const focusTrapRef = useFocusTrap(true);

  const close = () => { setExiting(true); setTimeout(onClose, 400); };
  useEscape(close);

  useEffect(() => { if (!open) { setCoverOpened(false); setPage(0); setExiting(false); } }, [open]);

  if (!open) return null;

  const visitedCount = visits.filter((v) => v.count > 0).length;
  const totalEvents = visits.reduce((s, v) => s + v.count, 0);
  const firstVisit = visits.filter((v) => v.count > 0).sort((a, b) => a.events[0].date.localeCompare(b.events[0].date))[0];
  const totalPages = visits.length + 1;
  const currentVisit = visits[page - 1];
  const isStats = page === 0;

  const goTo = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(totalPages - 1, p)));
  }, [totalPages]);

  const openCover = () => setCoverOpened(true);

  const touchStart = useRef<{ x: number; page: number; moved: boolean } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, page, moved: false }; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || touchStart.current.moved) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 30) {
      touchStart.current.moved = true;
      goTo(dx < 0 ? page + 1 : page - 1);
    }
  };
  const onTouchEnd = () => { touchStart.current = null; };

  // Page curl shadow
  const CURL_ANGLE = 4;

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Paszport POznaj" style={{
      position: "fixed", inset: 0, zIndex: 130, background: "#1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: exiting ? "pz-fade-out 0.35s var(--ease-out-quart) both" : "pz-fade-in 0.35s var(--ease-out-quart) both",
    }}>
      {/* Close button */}
      <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Zamknij" style={{
        position: "absolute", top: "calc(14px + var(--safe-t))", right: 14, zIndex: 10,
        width: 44, height: 44, borderRadius: 99, border: 0,
        background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)",
        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <CloseIcon size={18} />
      </button>

      {/* 3D scene */}
      <div style={{ perspective: "1400px", perspectiveOrigin: "left center", width: "90%", maxWidth: 380, aspectRatio: "0.7" }}>
        {/* Cover - burgundy passport cover */}
        {!coverOpened && (
          <div onClick={openCover} style={{
            width: "100%", height: "100%",
            background: "linear-gradient(145deg, #3D0C1A 0%, #4A0B23 15%, #5C0F2B 40%, #3D0C1A 70%, #2A0812 100%)",
            borderRadius: "6px 18px 18px 6px",
            border: "1px solid rgba(197,168,109,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", cursor: "pointer",
            animation: "pz-slide-up 0.5s var(--ease-spring) both",
          }}>
            {/* Spine */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 12,
              background: "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, transparent 100%)",
              borderRadius: "6px 0 0 6px",
              borderRight: "1px solid rgba(197,168,109,0.2)",
            }} />
            {/* Gold emblem */}
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              border: "2.5px solid rgba(197,168,109,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24, fontSize: 36,
              background: "radial-gradient(circle, rgba(197,168,109,0.1), transparent)",
            }}>
              🏛️
            </div>
            {/* Gold text */}
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.25em",
              color: "rgba(197,168,109,0.7)", textTransform: "uppercase",
              marginBottom: 8,
            }}>
              Paszport
            </div>
            <div className="pz-h" style={{
              fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #C5A86D, #E8D5A3, #C5A86D)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 20,
            }}>
              POznaj
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>
              {userName}
            </div>
            <div style={{ position: "absolute", bottom: 16, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
              Tapnij, aby otworzyć
            </div>
          </div>
        )}

        {/* Inner pages - visible after cover opens */}
        {coverOpened && (
          <div style={{
            width: "100%", height: "100%",
            transformStyle: "preserve-3d",
            animation: "pz-slide-up 0.4s var(--ease-spring) both",
          }}>
            {/* Page stack visual - pages underneath */}
            {Array.from({ length: Math.max(0, totalPages - page - 1) }).map((_, i) => (
              <div key={`under-${i}`} style={{
                position: "absolute", inset: 0,
                background: `hsl(40, 15%, ${94 - i * 1.5}%)`,
                borderRadius: "2px 12px 12px 2px",
                transform: `translateZ(-${(i + 1) * 1.5}px)`,
                borderLeft: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }} />
            ))}

            {/* Current page spread */}
            <div style={{
              position: "absolute", inset: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(0.5px)`,
            }}>
              {/* Left page (page state) */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: "50%",
                background: "#F7F3EC",
                borderRadius: "2px 0 0 2px",
                borderLeft: "1px solid rgba(0,0,0,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16, color: "#14130F",
                boxShadow: "inset -1px 0 0 rgba(0,0,0,0.03)",
              }}>
                {isStats ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(0,0,0,0.3)", marginBottom: 8 }}>
                      Paszport POznaj
                    </div>
                    <div className="pz-num" style={{ fontSize: "clamp(36px, 10vw, 52px)", fontWeight: 800 }}>
                      {visitedCount}<span style={{ fontSize: "0.4em", opacity: 0.4 }}>/6</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 4 }}>dzielnic</div>
                    <div style={{ fontSize: 10, color: "rgba(0,0,0,0.25)", marginTop: 12 }}>
                      {totalEvents} wydarzeń
                    </div>
                  </div>
                ) : currentVisit ? (
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                      Dzielnica
                    </div>
                    <div className="pz-h" style={{ fontSize: "clamp(14px, 4vw, 20px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                      {currentVisit.label}
                    </div>
                    {currentVisit.count > 0 ? (
                      <div style={{
                        width: 70, height: 70, borderRadius: "50%",
                        border: "2px dashed rgba(0,0,0,0.2)",
                        margin: "12px auto 0",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, color: "var(--c-muzyka)",
                        animation: "pz-stamp-in 0.6s var(--ease-out-quart) both",
                      }}>
                        <span style={{ fontSize: 7, opacity: 0.4 }}>POznaj</span>
                        {currentVisit.label.substring(0, 6)}
                        <span style={{ fontSize: 6, opacity: 0.35 }}>
                          {currentVisit.events[0]?.date}
                        </span>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.15, marginTop: 12, fontSize: 10 }}>—</div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Page curl on left edge */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 8,
                background: "linear-gradient(90deg, rgba(0,0,0,0.08) 0%, transparent 100%)",
                borderRadius: "2px 0 0 2px",
              }} />

              {/* Center spine crease */}
              <div style={{
                position: "absolute", left: "50%", top: 0, bottom: 0, width: 2,
                background: "linear-gradient(90deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06), rgba(0,0,0,0.03))",
                marginLeft: -1,
              }} />

              {/* Right page (next page / event details) */}
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "50%",
                background: "#F7F3EC",
                borderRadius: "0 2px 2px 0",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 14, color: "#14130F",
                boxShadow: "inset 1px 0 0 rgba(0,0,0,0.03)",
                textAlign: "center",
              }}>
                {isStats ? (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.3)", marginBottom: 8 }}>
                      {new Date().getFullYear()}
                    </div>
                    <div className="pz-num" style={{ fontSize: "clamp(32px, 9vw, 48px)", fontWeight: 800 }}>
                      {totalEvents}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 4 }}>wydarzeń</div>
                    {firstVisit && (
                      <div style={{ fontSize: 9, color: "rgba(0,0,0,0.2)", marginTop: 12 }}>
                        Od {firstVisit.events[0].date}
                      </div>
                    )}
                  </div>
                ) : currentVisit && currentVisit.count > 0 ? (
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(0,0,0,0.25)", marginBottom: 6 }}>
                      Wizyty
                    </div>
                    <div className="pz-num" style={{ fontSize: "clamp(24px, 7vw, 36px)", fontWeight: 800 }}>
                      {currentVisit.count}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", marginTop: 2 }}>
                      {currentVisit.count === 1 ? "wizyta" : currentVisit.count < 5 ? "wizyty" : "wizyt"}
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(0,0,0,0.2)", marginTop: 10, lineHeight: 1.5 }}>
                      {currentVisit.events.slice(0, 4).map((ev, i) => (
                        <div key={i}>{ev.date} — {ev.title.substring(0, 22)}{ev.title.length > 22 ? "…" : ""}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ opacity: 0.15, fontSize: 9 }}>
                    Jeszcze nieodwiedzona
                  </div>
                )}

                {/* Page curl on right edge */}
                {page < totalPages - 1 && (
                  <div style={{
                    position: "absolute", right: 0, bottom: 0, top: "60%", width: 20,
                    background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.06) 70%, transparent 100%)`,
                    borderRadius: "0 2px 0 0",
                    transform: `rotate(${CURL_ANGLE}deg)`,
                    transformOrigin: "bottom left",
                  }} />
                )}
              </div>
            </div>

            {/* Page fall shadow (from previous flipped pages) */}
            {page > 0 && (
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 40,
                background: "linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, transparent 100%)",
                borderRadius: "2px 0 0 0",
                pointerEvents: "none",
              }} />
            )}
          </div>
        )}
      </div>

      {/* Progress dots + page counter */}
      <div style={{
        position: "absolute", bottom: "calc(24px + var(--safe-b))", left: 24, right: 24,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {!coverOpened ? (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Tapnij okładkę, aby otworzyć</span>
        ) : (
          <>
            {page > 0 && (
              <button onClick={() => goTo(page - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 8 }}>
                <BackIcon size={16} />
              </button>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <span key={i} style={{
                  width: i === page ? 22 : 6, height: 6, borderRadius: 99,
                  background: i <= page ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                  transition: "all 0.3s var(--ease-out-quart)",
                }} />
              ))}
            </div>
            {page < totalPages - 1 && (
              <button onClick={() => goTo(page + 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 8 }}>
                <ArrowIcon size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Touch area for swiping */}
      {coverOpened && (
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            goTo(x > rect.width / 2 ? page + 1 : page - 1);
          }}
          style={{ position: "absolute", inset: 0, cursor: "pointer", zIndex: 1 }}
        />
      )}
    </div>
  );
}
