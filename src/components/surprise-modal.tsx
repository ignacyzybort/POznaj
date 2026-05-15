"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EventData } from "@/lib/data";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ShuffleIcon, RefreshIcon } from "@/components/icons";

function pickRandom(events: EventData[]): EventData {
  return events[Math.floor(Math.random() * events.length)];
}

function reelTick(events: EventData[], reelIndex: number, del: number, cb: (i: number, ev: EventData) => void) {
  if (del > 800) return;
  cb(reelIndex, pickRandom(events));
  setTimeout(() => reelTick(events, reelIndex, del * 1.45, cb), del);
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
  const [spinning, setSpinning] = useState(true);
  const [picked, setPicked] = useState<EventData | null>(null);
  const [exiting, setExiting] = useState(false);
  const [reels, setReels] = useState<(EventData | null)[]>([null, null, null]);
  const stopped = useRef(new Set<number>());

  useEscape(onClose);
  const focusTrapRef = useFocusTrap(true);

  const spin = useCallback(() => {
    setSpinning(true);
    setPicked(null);
    setReels([pickRandom(events), pickRandom(events), pickRandom(events)]);
    stopped.current = new Set();

    // Reel 0: starts at 80ms, stops ~1400ms
    reelTick(events, 0, 80, (i, ev) => {
      if (stopped.current.has(i)) return;
      setReels((prev) => { const next = [...prev]; next[i] = ev; return next; });
    });
    setTimeout(() => { stopped.current.add(0); setSpinning(false); }, 1400);

    // Reel 1: starts at 80ms, stops ~1800ms
    reelTick(events, 1, 120, (i, ev) => {
      if (stopped.current.has(i)) return;
      setReels((prev) => { const next = [...prev]; next[i] = ev; return next; });
    });
    setTimeout(() => { stopped.current.add(1); }, 1800);

    // Reel 2: starts at 80ms, stops ~2200ms
    reelTick(events, 2, 160, (i, ev) => {
      if (stopped.current.has(i)) return;
      setReels((prev) => { const next = [...prev]; next[i] = ev; return next; });
    });
    setTimeout(() => { stopped.current.add(2); }, 2200);

    // All fully stopped
    setTimeout(() => { stopped.current = new Set([0, 1, 2]); }, 2300);
  }, [events]);

  useEffect(() => { spin(); }, [spin]);

  const select = (ev: EventData) => {
    if (spinning || picked) return;
    setPicked(ev);
    setTimeout(() => onPick(ev), 800);
  };

  const allStopped = stopped.current.size >= 3;

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--scrim)",
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : undefined,
    }}>
      <div style={{ margin: "0 16px", maxWidth: 440, width: "100%", padding: 24, borderRadius: 28, background: "var(--bg-elev)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <ShuffleIcon size={20} />
          <h2 className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>Zaskocz mnie</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", margin: 0 }}>
            {spinning ? "Losowanie..." : picked ? "Świetny wybór!" : "Kliknij, aby wybrać"}
          </p>
        </div>

        {/* Three slot reels */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[0, 1, 2].map((col) => (
            <div key={col} style={{
              borderRadius: 22, overflow: "hidden",
              background: "var(--bg-soft)", position: "relative",
              boxShadow: picked?.id === reels[col]?.id ? "0 0 0 2px var(--sage)" : undefined,
            }}>
              <AnimatePresence mode="popLayout">
                {reels[col] && (
                  <motion.div
                    key={reels[col]!.id}
                    initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                    animate={{ opacity: allStopped ? 1 : 0.85, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                    onClick={() => select(reels[col]!)}
                    style={{ cursor: allStopped ? "pointer" : "default" }}
                  >
                    <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
                      {reels[col]!.imageUrl ? (
                        <img
                          src={reels[col]!.imageUrl}
                          alt={reels[col]!.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--stone)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "var(--ink-3)" }}>
                          {reels[col]!.category?.[0] ?? "?"}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 10 }}>
                      <p style={{
                        margin: 0, fontSize: 12, fontWeight: 700, lineHeight: 1.2, color: "var(--ink)",
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      } as React.CSSProperties}>
                        {reels[col]!.title}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {reels[col]!.time ?? relDay(new Date(reels[col]!.startDate))}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!spinning && !picked && (
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

function relDay(d: Date): string {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return "Dziś";
  if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
  return d.toLocaleDateString("pl", { day: "numeric", month: "short" });
}
