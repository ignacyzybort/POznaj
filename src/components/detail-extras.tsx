"use client";

import { useState, useEffect } from "react";
import type { EventData } from "@/lib/data";
import { SunIcon, RainIcon, TramIcon } from "@/components/icons";
import { getEventSlots, icalDate } from "@/lib/warsaw-time";

const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Centrum: { lat: 52.406, lon: 16.918 },
  StareMiasto: { lat: 52.430, lon: 16.940 },
  NoweMiasto: { lat: 52.380, lon: 16.970 },
  Jezyce: { lat: 52.418, lon: 16.895 },
  Grunwald: { lat: 52.390, lon: 16.870 },
  Wilda: { lat: 52.381, lon: 16.923 },
  Inny: { lat: 52.408, lon: 16.934 },
};

export default function DetailExtras({ event, onToast }: { event: EventData; onToast: (msg: string) => void }) {
  const [showCal, setShowCal] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; condition: string; icon: string; rain: boolean } | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ok" | "unavailable" | "error">("loading");

  const fullAddress = `${event.placeName}, ${event.address || "Poznań"}`;
  const hasCoords = typeof event.coordsX === "number" && typeof event.coordsY === "number";
  const coords = hasCoords
    ? { lat: event.coordsX as number, lon: event.coordsY as number }
    : (DISTRICT_COORDS[event.district] ?? DISTRICT_COORDS.Inny);

  const slots = getEventSlots(new Date(event.startDate), event.time);
  const slot = slots[0];
  const eventTs = slot.allDay ? slot.start.getTime() + 9 * 3_600_000 : slot.start.getTime();

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}&time=${eventTs}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.temp !== undefined && d.available !== false) {
          setWeather(d);
          setWeatherStatus("ok");
        } else {
          setWeather(null);
          setWeatherStatus(d.available === false ? "unavailable" : "error");
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setWeatherStatus("error");
      });
    return () => ctrl.abort();
  }, [coords.lat, coords.lon, event.id, eventTs]);

  const calStart = icalDate(slot.start);
  const calEnd = icalDate(slot.end);
  const calGoogle = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${calStart}/${calEnd}&details=${encodeURIComponent(event.description ?? "")}&location=${encodeURIComponent(fullAddress)}`;
  const calApple = `/api/ical/${event.id}?minutes=30`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Weather + Transit */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="pz-card" style={{ padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <SunIcon size={16} />
            <span className="pz-eyebrow">Pogoda</span>
          </div>
          {weather ? (
            <>
              <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>
                {weather.temp}°C · {weather.condition}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                {weather.rain ? <>Możliwy deszcz <RainIcon size={16} /></> : "Bez opadów"}
              </div>
            </>
          ) : weatherStatus === "loading" ? (
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Ładowanie...</div>
          ) : weatherStatus === "unavailable" ? (
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Prognoza bliżej terminu</div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Brak danych pogodowych</div>
          )}
        </div>
        <a href={`https://maps.google.com/?daddr=${encodeURIComponent(fullAddress)}&dir_action=transit`}
          target="_blank" rel="noopener noreferrer" className="pz-card" style={{ padding: 12, display: "block", textDecoration: "none", color: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <TramIcon size={16} />
            <span className="pz-eyebrow">Dojazd</span>
          </div>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>
            Sprawdź w Maps
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Tramwaj, autobus lub pieszo</div>
        </a>
      </div>

      {/* Weather warning */}
      {weather?.rain && event.outdoor && (
        <div style={{
          padding: "12px 14px", borderRadius: 14,
          background: "linear-gradient(135deg, color-mix(in srgb, var(--c-teatr) 14%, transparent), color-mix(in srgb, var(--c-muzyka) 10%, transparent))",
          boxShadow: "inset 0 0 0 0.5px color-mix(in srgb, var(--c-teatr) 25%, transparent)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <RainIcon size={16} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>Deszcz w prognozie</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Wydarzenie na zewnątrz — kurtkę bierz.</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <button className="pz-chip" onClick={() => setShowCal(!showCal)}
            style={{ width: "100%", justifyContent: "center", border: 0, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M12 14l1.5 1.5L16 13"/></svg>
            Kalendarz
          </button>
          {showCal && (
            <div className="pz-pop" style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4, background: "var(--bg-elev)", borderRadius: 14, border: "0.5px solid var(--line)", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 10 }}>
              <a href={calApple} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", color: "var(--ink)", borderBottom: "0.5px solid var(--line)" }}
                onClick={() => setShowCal(false)}>
                <span className="pz-mono" style={{ fontSize: 10, width: 24, height: 24, borderRadius: 6, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>ICS</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Apple Calendar</span>
              </a>
              <a href={calGoogle} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", color: "var(--ink)", borderBottom: "0.5px solid var(--line)" }}
                onClick={() => setShowCal(false)}>
                <span className="pz-mono" style={{ fontSize: 10, width: 24, height: 24, borderRadius: 6, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>G</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Google Calendar</span>
              </a>
              <a href={`/api/ical/${event.id}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textDecoration: "none", color: "var(--ink)" }}
                onClick={() => { setShowCal(false); onToast("Dodano do kalendarza"); }}>
                <span className="pz-mono" style={{ fontSize: 10, width: 24, height: 24, borderRadius: 6, background: "var(--bg-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>ICS</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Pobierz .ics</span>
              </a>
            </div>
          )}
        </div>
        <a href={`https://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
          Maps
        </a>
        <a href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(fullAddress)}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
          Uber
        </a>
        <a href={`https://bolt.eu/?dropoff=${encodeURIComponent(fullAddress)}`}
          target="_blank" rel="noopener noreferrer"
          className="pz-chip" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>
          Bolt
        </a>
      </div>

      {/* Source link */}
      {event.sourceUrl && (
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 16px", borderRadius: 14, textDecoration: "none",
            background: "var(--bg-soft)", color: "var(--ink-2)",
            fontSize: 13, fontWeight: 600,
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Otwórz źródło
        </a>
      )}
    </div>
  );
}
