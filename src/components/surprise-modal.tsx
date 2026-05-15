"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { EventData } from "@/lib/data";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ShuffleIcon, RefreshIcon } from "@/components/icons";

const CARD_H = 140;
const TAPE_N = 20;
const SPEED_EASING: [number, number, number, number] = [0, 0.85, 0.2, 1];

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

  // Each re-spin generates fresh unique tapes
  const tapes = useMemo(() => generateTapes(events), [events, spinKey]);
  // Landing indices: where each reel stops
  const stops = useMemo(() => [4 + Math.floor(Math.random() * 8), 5 + Math.floor(Math.random() * 8), 6 + Math.floor(Math.random() * 8)], [spinKey]);

  const stoppedRef = useRef([false, false, false]);
  const [ready, setReady] = useState([false, false, false]);

  const onReelDone = useCallback((i: number) => {
    stoppedRef.current[i] = true;
    setReady((prev) => { const n = [...prev]; n[i] = true; return n; });
  }, []);

  // Check if all stopped
  const allStopped = ready.every(Boolean);

  const spin = () => {
    setPhase("spinning");
    setPicked(null);
    setReady([false, false, false]);
    stoppedRef.current = [false, false, false];
    setSpinKey((k) => k + 1);
  };

  useEffect(() => { spin(); }, []);

  const select = (ev: EventData) => {
    if (phase !== "stopped" || picked) return;
    setPicked(ev);
    setPhase("picked");
    setTimeout(() => onPick(ev), 800);
  };

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
            {phase === "spinning" ? "Losowanie..." : picked ? "Świetny wybór!" : "Kliknij, aby wybrać"}
          </p>
        </div>

        {/* Three slot reels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[0, 1, 2, 3].slice(0, 3).map((col) => (
            <div key={col} style={{
              borderRadius: 18, overflow: "hidden", height: CARD_H, background: "var(--bg-soft)",
              boxShadow: picked?.id === tapes[col]?.[stops[col]]?.id && phase !== "spinning" ? "0 0 0 2px var(--sage)" : undefined,
              transition: "box-shadow 0.3s var(--ease-out-quart)",
            }}>
              <motion.div
                key={`tape-${col}-${spinKey}`}
                initial={{ y: 0 }}
                animate={phase === "spinning" ? { y: -(stops[col] * CARD_H) } : {}}
                transition={{
                  duration: 1.2 + col * 0.6,
                  ease: SPEED_EASING,
                }}
                onAnimationComplete={() => {
                  if (!picked) onReelDone(col);
                }}
              >
                {tapes[col].map((ev, i) => (
                  <div
                    key={ev.id}
                    onClick={() => select(ev)}
                    style={{
                      height: CARD_H, cursor: phase === "stopped" ? "pointer" : "default",
                      position: "relative",
                    }}
                  >
                    {ev.imageUrl ? (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", background: "var(--stone)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 32, fontWeight: 800, color: "var(--ink-4)",
                      }}>
                        {ev.category?.[0] ?? "?"}
                      </div>
                    )}
                    <div style={{
                      position: "absolute", left: 0, right: 0, bottom: 0,
                      padding: "8px 10px 6px",
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
