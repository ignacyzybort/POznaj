"use client";

import { useState, useEffect, useRef } from "react";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CloseIcon } from "@/components/icons";
import { categories, districts, vibes } from "@/lib/data";

const SLIDE_DURATION = 3000;
const MONTHS = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

const SLIDE_BGS = [
  "linear-gradient(135deg, #6E3DFF 0%, #2860FF 50%, #FF3D7F 100%)",
  "linear-gradient(135deg, #14130F 0%, #2A2723 50%, #3D5A40 100%)",
  "linear-gradient(135deg, #FF3D7F 0%, #FF6B2C 60%, #C8FF2E 100%)",
  "linear-gradient(135deg, #2860FF 0%, #6E3DFF 50%, #E89A6B 100%)",
  "linear-gradient(135deg, #1F2D5A 0%, #3D5A40 50%, #2A2723 100%)",
  "linear-gradient(135deg, #FF6B2C 0%, #C8FF2E 50%, #2EC36B 100%)",
  "linear-gradient(135deg, #14130F 0%, #6E3DFF 40%, #FF3D7F 80%, #C8FF2E 100%)",
];

type Slide = 
  | { type: "hero"; bg: string; big: string; label: string; sub: string }
  | { type: "bars"; bg: string; big: string; title: string; bars: number[]; max: number; sub?: string }
  | { type: "breakdown"; bg: string; big: string; items: { label: string; emoji?: string; count: number; _i: number }[]; max: number; sub?: string }
  | { type: "bigtext"; bg: string; big: string; label: string; sub?: string }
  | { type: "recap"; bg: string; title: string; items: { count: number; label: string; _i: number }[] };

export default function YearInReview({ open, onClose, stats }: {
  open: boolean; onClose: () => void;
  stats: {
    events: number; saved: number; friends: number;
    topDistrict: string; topCategory: string; topVenue: string; topVibe: string;
    streak: number; monthlyCount: number[]; maxMonth: number;
    catCount: Record<string, number>; vibeCount: Record<string, number>;
  };
}) {
  const [card, setCard] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = () => { setExiting(true); setTimeout(onClose, 300); };
  useEscape(close);
  const focusTrapRef = useFocusTrap(true);

  const slides = buildSlides(stats);

  useEffect(() => {
    if (!open) return;
    setCard(0);
    setPaused(false);
    setExiting(false);
  }, [open]);

  useEffect(() => {
    if (!open || paused) return;
    timerRef.current = setInterval(() => setCard((c) => (c + 1) % slides.length), SLIDE_DURATION);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open, paused, slides.length]);

  const handleTap = () => setCard((c) => (c + 1) % slides.length);

  if (!open) return null;

  const s = slides[card];

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Twoje podsumowanie roku" style={{
      position: "fixed", inset: 0, zIndex: 130,
      animation: exiting ? "pz-fade-out 0.3s var(--ease-out-quart) both" : "pz-fade-in 0.3s var(--ease-out-quart) both",
    }}>
      <div onClick={handleTap} style={{ position: "absolute", inset: 0, background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, cursor: "pointer" }}>
        {/* Progress dots */}
        <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", gap: 6, zIndex: 2 }}>
          {slides.map((_, i) => (
            <span key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= card ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "background 0.3s" }} />
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setPaused((p) => !p); }}
          aria-label={paused ? "Wznów pokaz" : "Zatrzymaj pokaz"}
          style={{ position: "absolute", top: 48, left: 12, background: "none", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 99, color: "rgba(255,255,255,0.85)", cursor: "pointer", minHeight: 36, padding: "0 12px", fontSize: 12, fontWeight: 700, zIndex: 2 }}
        >
          {paused ? "Wznów" : "Pauza"}
        </button>
        {/* Close button */}
        <button onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Zamknij" style={{ position: "absolute", top: 48, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <CloseIcon size={20} />
        </button>

        {/* Slide content */}
        <div key={card} aria-live="polite" style={{ width: "100%", color: "white", animation: "pz-slide-up 0.45s var(--ease-out-quart) both" }}>
          {s.type === "hero" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.6, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>POznaj Wrapped</div>
              <div className="pz-h" style={{ fontSize: "clamp(48px, 14vw, 80px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.05em", marginBottom: 12 }}>{s.big}</div>
              <div style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 600, opacity: 0.85 }}>{s.label}</div>
              <div style={{ fontSize: 13, opacity: 0.5, marginTop: 8 }}>{s.sub}</div>
            </div>
          )}

          {s.type === "bars" && (
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.5, marginBottom: 16, textAlign: "center" }}>{s.title}</div>
              <div className="pz-h" style={{ fontSize: "clamp(36px, 10vw, 56px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", textAlign: "center", marginBottom: 20 }}>{s.big}</div>
              {s.bars && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
                  {s.bars.map((v, i) => {
                    const h = s.max > 0 ? (v / s.max) * 100 : 2;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                        <div style={{ width: "100%", height: `${Math.max(h, 2)}%`, borderRadius: 8, background: `rgba(255,255,255,${i === new Date().getMonth() ? 0.9 : 0.4})`, minHeight: 4, transition: "height 0.5s var(--ease-out-quart)" }} />
                        <span style={{ fontSize: 10, fontWeight: 600, opacity: i === new Date().getMonth() ? 0.9 : 0.4 }}>{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {s.sub && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 12, textAlign: "center" }}>{s.sub}</div>}
            </div>
          )}

          {s.type === "breakdown" && (
            <div style={{ width: "100%" }}>
              <div className="pz-h" style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", textAlign: "center", marginBottom: 24 }}>{s.big}</div>
              {s.items && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {s.items.slice(0, 5).map((item) => {
                    const pct = s.max > 0 ? Math.round((item.count / s.max) * 100) : 0;
                    return (
                      <div key={item.label} style={{ animation: "pz-slide-up 0.4s var(--ease-out-quart) both", animationDelay: `${item._i * 80}ms` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
                          <span>{item.emoji ? item.emoji + " " : ""}{item.label}</span>
                          <span>{item.count}</span>
                        </div>
                        <div style={{ width: "100%", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.15)" }}>
                          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "rgba(255,255,255,0.7)", transition: "width 0.6s var(--ease-out-quart)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {s.sub && <div style={{ fontSize: 13, opacity: 0.5, marginTop: 16, textAlign: "center" }}>{s.sub}</div>}
            </div>
          )}

          {s.type === "bigtext" && (
            <div style={{ textAlign: "center" }}>
              <div className="pz-h" style={{ fontSize: "clamp(48px, 14vw, 80px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.05em", marginBottom: 8 }}>{s.big}</div>
              <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 600, opacity: 0.7 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 13, opacity: 0.45, marginTop: 16 }}>{s.sub}</div>}
            </div>
          )}

          {s.type === "recap" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{s.title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(12px, 3vw, 20px)", maxWidth: 320, margin: "0 auto" }}>
                {s.items?.map((item) => (
                  <div key={item.label} style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.12)", animation: "pz-slide-up 0.4s var(--ease-out-quart) both", animationDelay: `${item._i * 100}ms` }}>
                    <div className="pz-num" style={{ fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{item.count}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginTop: 24 }}>Do zobaczenia w {new Date().getFullYear() + 1}!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildSlides(stats: { events: number; saved: number; friends: number; topDistrict: string; topCategory: string; topVenue: string; topVibe: string; streak: number; monthlyCount: number[]; maxMonth: number; catCount: Record<string, number>; vibeCount: Record<string, number> }): Slide[] {
  const catMax = Object.values(stats.catCount).length > 0 ? Math.max(...Object.values(stats.catCount)) : 1;
  const vibeMax = Object.values(stats.vibeCount).length > 0 ? Math.max(...Object.values(stats.vibeCount)) : 1;
  const topCatLabel = categories.find((c) => c.value === stats.topCategory)?.label ?? stats.topCategory;
  const vibeLabel = (value: string) => vibes.find((v) => v.value === value)?.label ?? value;
  const districtLabel = (value: string) => districts.find((d) => d.value === value)?.label ?? value;
  const topVibes = Object.entries(stats.vibeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v], i) => ({ label: vibeLabel(k), emoji: undefined as string | undefined, count: v, _i: i }));
  const topCats = Object.entries(stats.catCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v], i) => ({ label: categories.find((c) => c.value === k)?.label ?? k, emoji: undefined as string | undefined, count: v, _i: i }));
  const bestMonth = stats.monthlyCount.indexOf(Math.max(...stats.monthlyCount));
  const streakLabel = stats.streak === 1 ? "tydzień z rzędu" : "tygodnie z rzędu";

  return [
    { type: "hero" as const, bg: SLIDE_BGS[0], big: `${new Date().getFullYear()}`, label: "Twój rok w POznaj", sub: `${stats.events} wydarzeń · ${stats.saved} zapisanych · ${stats.friends} znajomych` },
    { type: "bars" as const, bg: SLIDE_BGS[1], big: `${stats.events}`, title: "wydarzeń w tym roku", sub: stats.events > 0 && bestMonth >= 0 ? `Najaktywniejszy: ${MONTHS[bestMonth]}` : undefined, bars: stats.monthlyCount, max: stats.maxMonth },
    { type: "breakdown" as const, bg: SLIDE_BGS[2], big: "Kategorie", items: topCats, max: catMax, sub: `Top: ${topCatLabel}` },
    { type: "breakdown" as const, bg: SLIDE_BGS[3], big: "Nastrój", items: topVibes, max: vibeMax, sub: stats.topVibe ? `Twój vibe to ${vibeLabel(stats.topVibe)}` : undefined },
    { type: "bigtext" as const, bg: SLIDE_BGS[4], big: stats.topVenue || "Poznań", label: "Twoje ulubione miejsce", sub: stats.topDistrict !== "Inny" ? `Najwięcej czasu w ${districtLabel(stats.topDistrict)}` : undefined },
    { type: "bigtext" as const, bg: SLIDE_BGS[5], big: `${stats.streak}`, label: streakLabel, sub: stats.streak > 3 ? "Utrzymujesz formę!" : stats.streak > 0 ? "To już coś!" : "Zacznij swój streak!" },
    { type: "recap" as const, bg: SLIDE_BGS[6], title: "Twój rok w liczbach", items: [{ count: stats.events, label: "wydarzeń", _i: 0 }, { count: stats.saved, label: "zapisanych", _i: 1 }, { count: stats.friends, label: "znajomych", _i: 2 }, { count: stats.streak, label: "tyg. streak", _i: 3 }] },
  ];
}
