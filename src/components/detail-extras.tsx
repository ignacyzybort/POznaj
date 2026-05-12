"use client";

import type { EventData } from "@/lib/data";
import { districts } from "@/lib/data";
import { deriveTransit, deriveWeather, deriveCarpool } from "@/lib/mock-extras";
import {
  TramIcon, BusIcon, CarIcon, ChevronIcon,
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
        <a
          href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.startDate.replace(/[-:]/g, "").slice(0, 15)}Z/${event.endDate.replace(/[-:]/g, "").slice(0, 15)}Z&details=${encodeURIComponent(event.description ?? "")}&location=${encodeURIComponent(event.placeName + ", " + (event.address ?? "Poznań"))}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M12 14l1.5 1.5L16 13"/></svg>
          Kalendarz
        </a>
        <a
          href={`https://maps.apple.com/?q=${encodeURIComponent(event.placeName + " Poznań")}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          Maps
        </a>
        <a
          href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(event.placeName + ", " + (event.address ?? "Poznań"))}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          Uber
        </a>
        <a
          href={`https://bolt.eu/redirect/?type=ride&pickup=my_location&dropoff=${encodeURIComponent(event.placeName + ", Poznań")}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip"
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          Bolt
        </a>
      </div>
    </div>
  );
}
