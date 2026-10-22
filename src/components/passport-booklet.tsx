"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CloseIcon, BackIcon, ArrowIcon } from "@/components/icons";
import PassportCover from "@/components/passport-cover";
import PassportPage from "@/components/passport-page";

export interface DistrictVisit {
  district: string; label: string; count: number;
  events: { date: string; iso?: string; title: string }[];
}

const FLIP_DURATION = 500;

export default function PassportBooklet({
  open, onClose, visits, userName,
}: {
  open: boolean; onClose: () => void;
  visits: DistrictVisit[];
  userName: string;
}) {
  const [coverOpen, setCoverOpen] = useState(false);
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState<"forward" | "back" | null>(null);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTrapRef = useFocusTrap(true);

  const close = () => { setExiting(true); setTimeout(onClose, 400); };
  useEscape(close);

  useEffect(() => {
    if (!open) { setCoverOpen(false); setSpread(0); setFlipping(null); setExiting(false); }
  }, [open]);

  const totalSpreads = visits.length + 1; // stats + 6 districts
  const currentVisit = spread > 0 ? visits[spread - 1] : null;

  const goTo = useCallback((target: number) => {
    if (flipping) return;
    if (!coverOpen) { setCoverOpen(true); return; }
    const clamped = Math.max(0, Math.min(totalSpreads - 1, target));
    if (clamped === spread) return;
    setFlipping(clamped > spread ? "forward" : "back");
    timerRef.current = setTimeout(() => {
      setSpread(clamped);
      setFlipping(null);
    }, FLIP_DURATION);
  }, [coverOpen, spread, totalSpreads, flipping]);

  const nextPage = () => goTo(spread + 1);
  const prevPage = () => goTo(spread - 1);

  // Touch/swipe handling
  const touchStart = useRef<{ x: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || flipping) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? spread + 1 : spread - 1);
    touchStart.current = null;
  };

  // Tap left/right halves
  const handleTap = (e: React.MouseEvent) => {
    if (!coverOpen || flipping) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    goTo(e.clientX - rect.left > rect.width / 2 ? spread + 1 : spread - 1);
  };

  if (!open) return null;

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Paszport POznaj" style={{
      position: "fixed", inset: 0, zIndex: 130, background: "#111",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      animation: exiting ? "pz-fade-out 0.4s var(--ease-out-quart) both" : "pz-fade-in 0.3s var(--ease-out-quart) both",
    }}>
      {/* Close button */}
      <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Zamknij" style={{
        position: "absolute", top: "calc(14px + var(--safe-t))", right: 14, zIndex: 10,
        width: 44, height: 44, borderRadius: 99, border: 0,
        background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
        cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <CloseIcon size={18} />
      </button>

      {/* Cover phase */}
      {!coverOpen && (
        <div style={{ width: "88%", maxWidth: 380, aspectRatio: "0.7" }}>
          <PassportCover userName={userName} onOpen={() => { setCoverOpen(true); }} />
        </div>
      )}

      {/* Inner pages — 3D scene */}
      {coverOpen && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={handleTap}
          style={{ width: "88%", maxWidth: 380, aspectRatio: "0.7", cursor: "pointer" }}>
          {/* 3D perspective container */}
          <div style={{
            width: "100%", height: "100%", position: "relative",
            perspective: "1200px", perspectiveOrigin: "left center",
          }}>
            {/* Paper stack underneath */}
            {Array.from({ length: Math.max(0, totalSpreads - spread - 1) }).map((_, i) => (
              <div key={`under-${i}`} style={{
                position: "absolute", inset: 0,
                background: `hsl(40, 15%, ${95 - i * 1.2}%)`,
                borderRadius: "1px 10px 10px 1px",
                transform: `translateZ(-${(i + 1) * 2}px)`,
                borderLeft: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }} />
            ))}

            {/* Current spread — the one being viewed or being flipped */}
            <div style={{
              position: "absolute", inset: 0,
              transformStyle: "preserve-3d",
              transformOrigin: "left center",
              transform: flipping === "forward" ? "rotateY(-180deg)" : "rotateY(0deg)",
              transition: flipping ? `transform ${FLIP_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
              zIndex: flipping ? 10 : 1,
            }}>
              {/* Front face */}
              <div style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                background: "linear-gradient(135deg, #F4EFE6 0%, #EDE7D8 50%, #F2ECE0 100%)",
                borderRadius: "1px 10px 10px 1px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}>
                {/* Paper texture */}
                <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />
                <PassportPage isFirst={spread === 0} spread={spread} visits={visits} />
              </div>

              {/* Back face */}
              <div style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #F4EFE6 0%, #EDE7D8 50%, #F2ECE0 100%)",
                borderRadius: "1px 10px 10px 1px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }} />
              </div>

              {/* Flip shadow overlay (appears during forward flip) */}
              {flipping === "forward" && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "1px 10px 10px 1px",
                  background: "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)",
                  pointerEvents: "none",
                  animation: `pz-flip-shadow ${FLIP_DURATION}ms ease both`,
                }} />
              )}
            </div>

            {/* Page curl indicator on right edge */}
            {spread < totalSpreads - 1 && !flipping && (
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 16,
                background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 100%)",
                borderRadius: "0 10px 10px 0", pointerEvents: "none", zIndex: 20,
              }} />
            )}
          </div>
        </div>
      )}

      {/* Nav bar */}
      {coverOpen && (
        <div style={{
          position: "absolute", bottom: "calc(24px + var(--safe-b))",
          left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={prevPage} aria-label="Poprzednia strona" disabled={spread === 0 || !!flipping} style={{
            background: "none", border: "none", cursor: spread === 0 ? "default" : "pointer",
            opacity: spread === 0 ? 0.2 : 0.5, padding: 8, color: "white",
          }}>
            <BackIcon size={18} />
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <span key={i} style={{
                width: i === spread ? 20 : 5, height: 5, borderRadius: 99,
                background: i <= spread ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)",
                transition: "all 0.3s var(--ease-out-quart)",
              }} />
            ))}
          </div>
          <button onClick={nextPage} aria-label="Następna strona" disabled={spread >= totalSpreads - 1 || !!flipping} style={{
            background: "none", border: "none", cursor: spread >= totalSpreads - 1 ? "default" : "pointer",
            opacity: spread >= totalSpreads - 1 ? 0.2 : 0.5, padding: 8, color: "white",
          }}>
            <ArrowIcon size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
