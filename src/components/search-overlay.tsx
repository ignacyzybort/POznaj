"use client";

import { useState, useEffect } from "react";
import type { EventData } from "@/lib/data";
import { relWhen } from "@/lib/date";
import EventArt from "@/components/event-art";
import CategoryTag from "@/components/category-tag";
import { SearchIcon } from "@/components/icons";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export default function SearchOverlay({
  onClose, events, initial, onCommit, onOpen,
}: {
  onClose: () => void;
  events: EventData[];
  initial: string;
  onCommit: (q: string) => void;
  onOpen: (ev: EventData) => void;
}) {
  const [q, setQ] = useState(initial ?? "");
  const [exiting, setExiting] = useState(false);
  const [results, setResults] = useState<EventData[] | null>(null);
  const [loading, setLoading] = useState(false);
  useEscape(onClose);
  const focusTrapRef = useFocusTrap(true);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/events?q=${encodeURIComponent(term)}&limit=8&sort=score`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.events) setResults(d.events); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  const close = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  const localFiltered = events.filter((e) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      e.title.toLowerCase().includes(needle) ||
      e.placeName.toLowerCase().includes(needle) ||
      e.district.toLowerCase().includes(needle)
    );
  });
  const filtered = (results ?? localFiltered).slice(0, 8);

  return (
    <div
      ref={focusTrapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Szukaj wydarzeń"
      className="pz-search-root"
      style={{
      position: "fixed", inset: 0, background: "var(--scrim)", zIndex: 70,
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : "pz-fade-in var(--dur-fast) var(--ease-out-quart) both",
      display: "flex", justifyContent: "center",
    }}>
      <div className="pz-search-panel">
      <div style={{ padding: "54px 16px 10px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          flex: 1, height: 44, borderRadius: 14,
          background: "var(--bg-soft)",
          display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
        }}>
          <span style={{ color: "var(--ink-3)" }}><SearchIcon size={18} /></span>
          <label htmlFor="search-overlay-input" className="sr-only">Szukaj wydarzeń</label>
          <input
            id="search-overlay-input" autoFocus value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onCommit(q); close(); }
            }}
            placeholder="Szukaj wydarzeń, miejsc, dzielnic…"
            style={{
              flex: 1, border: 0, background: "transparent",
              outline: "none", font: "inherit",
              fontSize: 16, color: "var(--ink)",
            }}
          />
        </div>
        <button onClick={close} style={{
          border: 0, background: "transparent", color: "var(--ink-2)",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>Anuluj</button>
      </div>

      <div className="pz-scroll" style={{ flex: 1, padding: "6px 18px 16px" }}>

        <div className="pz-eyebrow" style={{ marginBottom: 10 }}>{q ? (loading ? "Szukam…" : "Wyniki") : "Popularne dziś"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((ev) => (
            <button key={ev.id} onClick={() => { onOpen(ev); close(); }} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 4px", border: 0, background: "transparent",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
                <EventArt event={ev} height={44} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: "var(--ink)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{ev.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                  {relWhen(ev.startDate, ev.endDate)} · {ev.placeName}
                </div>
              </div>
              <CategoryTag cat={ev.category} />
            </button>
          ))}
          {q && filtered.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div className="pz-display" style={{ fontSize: 32, lineHeight: 1, marginBottom: 8 }}>nic</div>
              <p style={{ color: "var(--ink-3)", fontSize: 13, margin: 0 }}>Nic dla &quot;{q}&quot;. Spróbuj inaczej.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
