"use client";

import { useState } from "react";
import type { EventData } from "@/lib/data";
import { relDay } from "@/lib/date";
import EventArt from "@/components/event-art";
import CategoryTag from "@/components/category-tag";
import { SearchIcon } from "@/components/icons";

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

  const close = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  const filtered = events.filter((e) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      e.title.toLowerCase().includes(needle) ||
      e.placeName.toLowerCase().includes(needle) ||
      e.district.toLowerCase().includes(needle)
    );
  }).slice(0, 8);

  return (
    <div style={{
      position: "absolute", inset: 0, background: "var(--bg)", zIndex: 40,
      animation: exiting ? "pz-fade-out 0.2s ease both" : "pz-fade-in 0.22s ease both",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "54px 16px 10px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{
          flex: 1, height: 44, borderRadius: 16,
          background: "var(--bg-soft)",
          display: "flex", alignItems: "center", padding: "0 14px", gap: 8,
        }}>
          <span style={{ color: "var(--ink-3)" }}><SearchIcon size={18} /></span>
          <input
            autoFocus value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj wydarzeń, miejsc, dzielnic…"
            style={{
              flex: 1, border: 0, background: "transparent",
              outline: "none", font: "inherit",
              fontSize: 15, color: "var(--ink)",
            }}
          />
        </div>
        <button onClick={() => { onCommit(q); close(); }} style={{
          border: 0, background: "transparent", color: "var(--ink-2)",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
        }}>Anuluj</button>
      </div>

      <div className="pz-scroll" style={{ flex: 1, padding: "6px 18px 16px" }}>

        <div className="pz-eyebrow" style={{ marginBottom: 10 }}>{q ? "Wyniki" : "Popularne dziś"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((ev) => (
            <button key={ev.id} onClick={() => { onCommit(q); onOpen(ev); close(); }} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 4px", border: 0, background: "transparent",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                <EventArt event={ev} height={44} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: "var(--ink)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{ev.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                  {relDay(new Date(ev.startDate))} · {ev.placeName}
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
  );
}
