"use client";

import { useState, useEffect, useRef } from "react";
import { categories, districts, vibes, vibeEmoji } from "@/lib/data";
import { CloseIcon } from "@/components/icons";
import { DUR } from "@/lib/duration";
import { useEscape } from "@/hooks/use-escape";

export type ActiveFilters = {
  category: string[];
  district: string[];
  vibe: string[];
};

export default function FiltersSheet({
  open, onClose, active, onToggle, onClear,
}: {
  open: boolean;
  onClose: () => void;
  active: ActiveFilters;
  onToggle: (kind: keyof ActiveFilters, value: string) => void;
  onClear: () => void;
}) {
  const count = active.category.length + active.district.length + active.vibe.length;
  const [exiting, setExiting] = useState(false);
  const [show, setShow] = useState(open);

  useEffect(() => {
    if (open) setShow(true);
    else {
      setExiting(true);
      setTimeout(() => { setExiting(false); setShow(false); }, DUR.slow);
    }
  }, [open]);

  const close = () => {
    setExiting(true);
    setTimeout(() => { setExiting(false); onClose(); }, DUR.slow);
  };
  useEscape(close);

  const startY = useRef(0);
  const startTime = useRef(0);
  const [dragY, setDragY] = useState(0);
  const dragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = e.changedTouches[0].clientY - startY.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = elapsed > 0 ? dy / elapsed : 0;
    if (dy > 80 || velocity > 0.4) close();
    else setDragY(0);
  };

  if (!show) return null;

  const sections: { key: keyof ActiveFilters; title: string; opts: { v: string; label: string; emoji?: string }[] }[] = [
    { key: "category", title: "Kategorie", opts: categories.map((c) => ({ v: c.value, label: c.label })) },
    { key: "district", title: "Dzielnice", opts: districts.map((d) => ({ v: d.value, label: d.label })) },
    { key: "vibe", title: "Nastrój", opts: vibes.map((v) => ({ v: v.value, label: v.label, emoji: vibeEmoji[v.value] })) },
  ];

  return (
    <>
      <div className="pz-sheet-backdrop" data-open={open && !exiting} onClick={close} />
      <div className="pz-sheet" role="dialog" aria-modal="true" data-open={open && !exiting}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{
          maxHeight: "86%",
          transform: open && !exiting ? (dragY ? `translateY(${dragY}px)` : undefined) : undefined,
          transition: dragY > 0 && dragging.current ? "none" : undefined,
        }}>
        <div className="pz-sheet-grabber" />
        <div style={{
          padding: "14px 18px 8px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <h2 className="pz-h" style={{
            margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.025em",
          }}>Filtry</h2>
          <button onClick={close} aria-label="Zamknij" style={{
            width: 44, height: 44, borderRadius: 99, border: 0,
            background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="pz-scroll" style={{ padding: "0 18px 16px", flex: 1, minHeight: 0 }}>
          {sections.map((s) => (
            <div key={s.key} style={{ marginBottom: 22 }}>
              <div className="pz-eyebrow" style={{ marginBottom: 10 }}>{s.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {s.opts.map((o) => {
                  const isActive = active[s.key].includes(o.v);
                  return (
                    <button key={o.v} className="pz-chip" aria-pressed={isActive}
                            data-active={isActive ? "true" : undefined}
                            onClick={() => onToggle(s.key, o.v)}>
                      {o.emoji && <span>{o.emoji}</span>}{o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: "10px 18px 24px", display: "flex", gap: 10,
          boxShadow: "0 -0.5px 0 var(--line)",
        }}>
          <button className="pz-btn ghost" onClick={onClear}>Wyczyść</button>
          <button className="pz-btn primary" style={{ flex: 1 }} onClick={close}>
            Pokaż {count > 0 ? `(${count})` : "wyniki"}
          </button>
        </div>
      </div>
    </>
  );
}
