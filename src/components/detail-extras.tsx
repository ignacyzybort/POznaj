"use client";

import type { EventData } from "@/lib/data";
import { districts } from "@/lib/data";
import { deriveTransit, deriveWeather, deriveCarpool } from "@/lib/mock-extras";
import {
  TramIcon, BusIcon, CarIcon, CalPlusIcon, PinIcon, ChevronIcon,
  SunIcon, CloudIcon, RainIcon, MoonIcon,
} from "@/components/icons";

function weatherIcon(kind: "sun" | "cloud" | "rain" | "moon") {
  switch (kind) {
    case "sun":   return <SunIcon size={16} />;
    case "cloud": return <CloudIcon size={16} />;
    case "rain":  return <RainIcon size={16} />;
    case "moon":  return <MoonIcon size={16} />;
  }
}

function districtLabel(value: string): string {
  return districts.find((d) => d.value === value)?.label ?? "Poznań";
}

export default function DetailExtras({
  event, onToast,
}: {
  event: EventData;
  onToast: (msg: string) => void;
}) {
  const transit = deriveTransit(event);
  const weather = deriveWeather(event);
  const carpool = deriveCarpool(event);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {weather.warn && (
        <div style={{
          padding: "12px 14px", borderRadius: 14,
          background: "linear-gradient(135deg, rgba(255,107,44,0.14), rgba(255,61,127,0.10))",
          border: "0.5px solid rgba(255,107,44,0.25)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ color: "#FF6B2C", display: "inline-flex" }}>
            <RainIcon size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Deszcz w prognozie</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Wydarzenie na zewnątrz — kurtkę bierz.</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="pz-card" style={{ padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "var(--ink-3)" }}>
              {transit.kind === "tram" ? <TramIcon size={16} /> : <BusIcon size={16} />}
            </span>
            <span className="pz-eyebrow">Dojazd</span>
          </div>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>
            <span className="pz-num">{transit.line}</span> · {transit.mins} min
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>ostatni {transit.last}</div>
        </div>
        <div className="pz-card" style={{ padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "var(--ink-3)" }}>{weatherIcon(weather.icon)}</span>
            <span className="pz-eyebrow">Pogoda</span>
          </div>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>
            <span className="pz-num">{weather.label}</span> · {weather.sub}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            {event.outdoor ? "Na zewnątrz" : "Pod dachem"}
          </div>
        </div>
      </div>

      {carpool > 0 && (
        <button
          className="pz-card"
          onClick={() => onToast(`Carpool — szukamy Cię do ekipy 🚗`)}
          style={{
            padding: 12, display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer", textAlign: "left", border: 0,
            background: "var(--bg-elev)", width: "100%",
          }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "var(--bg-soft)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <CarIcon size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Carpool · {carpool} {carpool === 1 ? "osoba" : "osoby"} z {districtLabel(event.district)}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Załap się — zrzutka ~12 zł</div>
          </div>
          <span style={{ color: "var(--ink-3)" }}>
            <ChevronIcon size={18} />
          </span>
        </button>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="pz-chip"
          onClick={() => onToast("Dodano do kalendarza 📅")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <span style={{ marginRight: 6 }}><CalPlusIcon size={14} /></span>
          Kalendarz
        </button>
        <button
          className="pz-chip"
          onClick={() => onToast("Otwieram Maps…")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <span style={{ marginRight: 6 }}><PinIcon size={14} /></span>
          Maps
        </button>
        <button
          className="pz-chip"
          onClick={() => onToast("Uber zamówiony 🚗")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          Uber
        </button>
        <button
          className="pz-chip"
          onClick={() => onToast("Bolt zamówiony 🛴")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          Bolt
        </button>
      </div>
    </div>
  );
}
