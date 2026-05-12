"use client";

import { useState } from "react";

const CARDS = [
  { bg: "linear-gradient(135deg,#FF3D7F,#6E3DFF)", big: "47", label: "wydarzeń", sub: "Średnio prawie jedno w tygodniu." },
  { bg: "linear-gradient(135deg,#2860FF,#06B6D4)", big: "132h", label: "na mieście", sub: "To 5 i pół doby." },
  { bg: "linear-gradient(135deg,#C8FF2E,#2EC36B)", big: "12", label: "nowych miejsc", sub: "Najbardziej polubiłeś Jeżyce." },
  { bg: "linear-gradient(135deg,#FFB627,#FF6B2C)", big: "15", label: "osób na ekipie", sub: "Twoja kategoria to Muzyka." },
];

export default function YearInReview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [card, setCard] = useState(0);
  if (!open) return null;
  const c = CARDS[card];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 130, background: "black", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", top: 56, left: 12, right: 12, display: "flex", gap: 4, zIndex: 2 }}>
        {CARDS.map((_, i) => (
          <span key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= card ? "white" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <button onClick={onClose} style={{ position: "absolute", top: 56, right: 16, background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer" }}>✕</button>
      <div onClick={() => setCard((card + 1) % CARDS.length)} style={{ cursor: "pointer", textAlign: "center", color: "white", width: "100%", padding: 20, borderRadius: 32, background: c.bg, minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="pz-num" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{c.big}</div>
        <div className="pz-h" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 8 }}>{c.label}</div>
        <div style={{ fontSize: 15, opacity: 0.85, marginTop: 8 }}>{c.sub}</div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 24 }}>Tapnij, aby zobaczyć więcej</p>
    </div>
  );
}
