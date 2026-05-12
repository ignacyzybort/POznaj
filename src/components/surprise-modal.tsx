"use client";

import { useState, useEffect, useCallback } from "react";
import { EventData, categoryEmoji } from "@/lib/data";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,19,15,0.5)" }}>
      <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)" }}>
        <div className="text-center mb-4">
          <span className="text-3xl">🔀</span>
          <h2 className="text-lg font-bold mt-2" style={{ color: "var(--ink)" }}>Zaskocz mnie</h2>
          <p className="text-xs" style={{ color: "var(--ink-3)" }}>{spinning ? "Losowanie..." : "Wybierz jedno!"}</p>
        </div>

        <div className="space-y-2 mb-4">
          {results.map((ev, i) => (
            <button
              key={ev.id + i}
              onClick={() => !spinning && select(ev)}
              disabled={spinning || !!picked}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left border-0 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
              style={{
                background: picked?.id === ev.id ? "var(--sage-soft)" : "var(--bg-soft)",
                opacity: spinning ? 0.6 + Math.random() * 0.4 : 1,
              }}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-elev)]">
                {ev.imageUrl && <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold line-clamp-1" style={{ color: "var(--ink)" }}>{ev.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                  {categoryEmoji[ev.category]} {ev.placeName} · {ev.time ?? ""}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {!spinning && !picked && (
            <button onClick={spin} className="flex-1 h-11 rounded-2xl text-sm font-bold border-0 cursor-pointer" style={{ background: "var(--bg-soft)", color: "var(--ink)" }}>
              🔄 Jeszcze raz
            </button>
          )}
          <button onClick={onClose} className="flex-1 h-11 rounded-2xl text-sm font-bold border-0 cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)" }}>
            {picked ? "🚀 Idę!" : "✕ Zamknij"}
          </button>
        </div>
      </div>
    </div>
  );
}
