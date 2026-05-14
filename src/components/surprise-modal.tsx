"use client";

import { useState, useEffect, useCallback } from "react";
import { EventData, categoryEmoji } from "@/lib/data";
import { useEscape } from "@/hooks/use-escape";
import { ShuffleIcon, RefreshIcon, ArrowIcon } from "@/components/icons";

function getRandomEvents(events: EventData[], count: number): EventData[] {
  const shuffled = [...events].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  const [results, setResults] = useState<EventData[]>([]);
  const [picked, setPicked] = useState<EventData | null>(null);
  const [exiting, setExiting] = useState(false);
  useEscape(onClose);

  const spin = useCallback(() => {
    setSpinning(true);
    setPicked(null);
    setResults([]);

    const interval = setInterval(() => {
      setResults(getRandomEvents(events, 3));
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      const final = getRandomEvents(events, 3);
      setResults(final);
      setSpinning(false);
    }, 1800);
  }, [events]);

  useEffect(() => {
    spin();
  }, [spin]);

  const select = (e: EventData) => {
    setPicked(e);
    setTimeout(() => onPick(e), 800);
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--scrim)",
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : undefined,
    }}>
      <div style={{ margin: "0 16px", maxWidth: 384, width: "100%", padding: 24, borderRadius: 28, background: "var(--bg-elev)" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <ShuffleIcon size={18} />
          <h2 className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>Zaskocz mnie</h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", margin: 0 }}>{spinning ? "Losowanie..." : "Wybierz jedno!"}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {results.map((ev, i) => (
            <button
              key={ev.id + i}
              onClick={() => !spinning && select(ev)}
              disabled={spinning || !!picked}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 22,
                textAlign: "left", border: 0, cursor: spinning || !!picked ? "default" : "pointer",
                background: picked?.id === ev.id ? "var(--sage-soft)" : "var(--bg-soft)",
                opacity: spinning ? 0.65 : 1,
                transition: "transform var(--dur-fast) var(--ease-out-quart)",
                animation: spinning ? "pz-pulse 0.15s var(--ease-out-quart) infinite alternate" : undefined,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--bg-elev)" }}>
                {ev.imageUrl && <img loading="lazy" src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</p>
                <p style={{ fontSize: "var(--text-xs)", marginTop: 2, color: "var(--ink-3)" }}>
                  {categoryEmoji[ev.category]} {ev.placeName} · {ev.time ?? ""}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!spinning && !picked && (
            <button onClick={spin} className="pz-btn ghost" style={{ flex: 1, height: 44, fontSize: "var(--text-sm)" }}>
              <RefreshIcon size={18} /> Jeszcze raz
            </button>
          )}
          <button onClick={() => { setExiting(true); setTimeout(onClose, 200); }} className="pz-btn primary" style={{ flex: 1, height: 44, fontSize: "var(--text-sm)" }}>
            {picked ? <><ArrowIcon size={18} /> Idę!</> : "✕ Zamknij"}
          </button>
        </div>
      </div>
    </div>
  );
}
