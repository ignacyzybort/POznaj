"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { EventData } from "@/lib/data";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ShuffleIcon, RefreshIcon } from "@/components/icons";

const CARD_H = 140;
const TAPE_N = 50;
const SLOT_EASE: [number, number, number, number] = [0, 0.92, 0.25, 1];

function generateTapes(events: EventData[]): [EventData[], EventData[], EventData[]] {
  const used = new Set<string>();
  const build = (): EventData[] => {
    const reel: EventData[] = [];
    while (reel.length < TAPE_N) {
      const ev = events[Math.floor(Math.random() * events.length)];
      if (!used.has(ev.id)) { used.add(ev.id); reel.push(ev); }
    }
    return reel;
  };
  return [build(), build(), build()];
}

function relDay(d: Date): string {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return "Dziś";
  if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
  return d.toLocaleDateString("pl", { day: "numeric", month: "short" });
}

export default function SurpriseModal({
  events,
  onPick,
  onClose,
}: {
  events: EventData[];
  onPick: (event: EventData) => void;
  onClose: () => void;
}) {
  const [spinKey, setSpinKey] = useState(0);
  const [phase, setPhase] = useState<"spinning" | "stopped" | "picked">("spinning");
  const [picked, setPicked] = useState<EventData | null>(null);
  const [exiting, setExiting] = useState(false);

  useEscape(onClose);
  const focusTrapRef = useFocusTrap(true);

  const tapes = useMemo(() => generateTapes(events), [events, spinKey]);
  const stops = useMemo(() => [
    TAPE_N - 4 - Math.floor(Math.random() * 3),
    TAPE_N - 5 - Math.floor(Math.random() * 3),
    TAPE_N - 6 - Math.floor(Math.random() * 3),
  ], [spinKey]);
  const winEvents = useMemo(() => [
    tapes[0][stops[0]],
    tapes[1][stops[1]],
    tapes[2][stops[2]],
  ], [tapes, stops]);

  const [done, setDone] = useState([false, false, false]);
  const allStopped = done.every(Boolean) && phase === "spinning";

  const snap = useCallback(() => {
    setPhase("stopped");
  }, []);

  const spin = () => {
    setPhase("spinning");
    setPicked(null);
    setDone([false, false, false]);
    setSpinKey((k) => k + 1);
  };

  useEffect(() => { spin(); }, []);

  useEffect(() => {
    if (allStopped) {
      const t = setTimeout(snap, 400);
      return () => clearTimeout(t);
    }
  }, [allStopped, snap]);

  const select = (ev: EventData) => {
    if (phase !== "stopped" || picked) return;
    setPicked(ev);
    setPhase("picked");
    setTimeout(() => onPick(ev), 800);
  };

  const durations = [2.4, 2.9, 3.4];

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--scrim)",
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : undefined,
    }}>
      <div style={{ margin: "0 16px", maxWidth: 440, width: "100%", padding: "24px 16px", borderRadius: 28, background: "var(--bg-elev)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <ShuffleIcon size={20} />
          <h2 className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>Zaskocz mnie</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", margin: 0 }}>
            {phase === "spinning" ? (done.filter(Boolean).length ? "Zwalniamy..." : "Losowanie...") : picked ? "Świetny wybór!" : "Kliknij, aby wybrać"}
          </p>
        </div>

        {/* Three slot reels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[0, 1, 2].map((col) => (
            <div key={col} style={{
              borderRadius: 18, overflow: "hidden", height: CARD_H, background: "var(--bg-soft)",
              position: "relative",
            }}>
              <motion.div
                key={`tape-${col}-${spinKey}`}
                style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  boxShadow: done[col] || allStopped
                    ? (picked?.id === winEvents[col]?.id ? "0 0 0 2px var(--sage) inset" : undefined)
                    : undefined,
                }}
                initial={{ y: 0, filter: "blur(3px)" }}
                animate={phase === "spinning" ? {
                  y: -(stops[col] * CARD_H),
                  filter: "blur(0px)",
                } : { y: -(stops[col] * CARD_H), filter: "blur(0px)" }}
                transition={{
                  duration: durations[col],
                  ease: SLOT_EASE,
                  delay: 0,
                }}
                onAnimationComplete={() => setDone((prev) => { const n = [...prev]; n[col] = true; return n; })}
              >
                {tapes[col].map((ev, i) => (
                  <div
                    key={ev.id}
                    onClick={() => select(ev)}
                    style={{
                      height: CARD_H, position: "relative",
                      cursor: allStopped || phase === "stopped" ? "pointer" : "default",
                      transition: "opacity 0.3s var(--ease-out-quart)",
                    }}
                  >
                    {ev.imageUrl ? (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        style={{ width: "100%", height:CARD_H, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", background: "var(--stone)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 36, fontWeight: 800, color: "var(--ink-4)",
                      }}>
                        {(ev.category ?? "?")[0]}
                      </div>
                    )}
                    <div style={{
                      position: "absolute", left: 0, right: 0, bottom: 0,
                      padding: "10px 10px 8px",
                      background: "linear-gradient(180deg, transparent, rgba(20,19,15,0.8))",
                    }}>
                      <p style={{
                        margin: 0, fontSize: 11, fontWeight: 700, color: "white", lineHeight: 1.2,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as React.CSSProperties}>{ev.title}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {phase === "stopped" && !picked && (
            <button onClick={spin} className="pz-btn ghost" style={{ flex: 1, height: 44, fontSize: "var(--text-sm)" }}>
              <RefreshIcon size={18} /> Jeszcze raz
            </button>
          )}
          {picked ? (
            <button className="pz-btn primary" autoFocus style={{ flex: 1, height: 44, fontSize: "var(--text-sm)" }}>
              <ShuffleIcon size={16} /> Idę!
            </button>
          ) : (
            <button onClick={() => { setExiting(true); setTimeout(onClose, 200); }} className="pz-btn primary" autoFocus style={{ flex: 1, height: 44, fontSize: "var(--text-sm)" }}>
              ✕ Zamknij
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
