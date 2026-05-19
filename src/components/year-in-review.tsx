"use client";

import { useState } from "react";
import { useEscape } from "@/hooks/use-escape";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { CloseIcon } from "@/components/icons";

export default function YearInReview({
  open, onClose, stats,
}: {
  open: boolean; onClose: () => void;
  stats: { events: number; newPlaces: number; friends: number; topDistrict: string; topCategory: string };
}) {
  const [card, setCard] = useState(0);
  const [exiting, setExiting] = useState(false);

  const close = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };
  useEscape(close);
  const focusTrapRef = useFocusTrap(true);

  if (!open) return null;

  const hoursOut = Math.round(stats.events * 3.5);
  const eventMsg = stats.events < 5 ? "Dopiero zaczynasz przygodę!" : stats.events < 15 ? "Niezły poziom, coraz lepiej!" : stats.events < 30 ? "Prawdziwy bywalec!" : "Mistrz Poznania!";
  const hoursMsg = hoursOut < 20 ? "Jeszcze będzie intensywnie." : hoursOut < 80 ? "Całkiem spędzony czas!" : "To już poważne zaangażowanie.";
  const placeMsg = stats.newPlaces === 0 ? "Czas odkryć nowe dzielnice!" : stats.newPlaces < 3 ? "Zaczynasz poznawać miasto." : stats.newPlaces < 6 ? "Niezła różnorodność!" : "Znasz Poznań jak własną kieszeń!";
  const CARDS = [
    { bg: "linear-gradient(135deg, var(--c-muzyka), var(--c-kino))", big: `${stats.events}`, label: "wydarzeń", sub: eventMsg },
    { bg: "linear-gradient(135deg, var(--c-sztuka), var(--c-teatr))", big: `${hoursOut}h`, label: "na mieście", sub: hoursMsg },
    { bg: "linear-gradient(135deg, var(--c-sport), var(--sage))", big: `${stats.newPlaces}`, label: "nowych miejsc", sub: stats.newPlaces > 0 && stats.topDistrict !== "Inny" ? `Najbardziej polubiłeś ${stats.topDistrict}.` : placeMsg },
    { bg: "linear-gradient(135deg, var(--c-jedzenie), var(--c-teatr))", big: `${stats.friends}`, label: "osób na ekipie", sub: `Twoja kategoria to ${stats.topCategory}.` },
  ];
  const c = CARDS[card];

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true" aria-label="Twoje podsumowanie roku" style={{
      position: "fixed", inset: 0, zIndex: 130, background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : undefined,
    }}>
      <div style={{ position: "absolute", top: 56, left: 12, right: 12, display: "flex", gap: 4, zIndex: 2 }}>
        {CARDS.map((_, i) => (
          <span key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= card ? "white" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <button onClick={close} aria-label="Zamknij" style={{ position: "absolute", top: 56, right: 16, background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CloseIcon size={20} /></button>
      <div onClick={() => setCard((card + 1) % CARDS.length)} style={{ cursor: "pointer", textAlign: "center", color: "white", width: "100%", padding: 20, borderRadius: 28, background: c.bg, minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="pz-num" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{c.big}</div>
        <div className="pz-h" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8 }}>{c.label}</div>
        <div style={{ fontSize: 15, opacity: 0.85, marginTop: 8 }}>{c.sub}</div>
      </div>
      <p style={{ color: "var(--ink-4)", fontSize: 13, marginTop: 24 }}>Tapnij, aby zobaczyć więcej</p>
    </div>
  );
}
