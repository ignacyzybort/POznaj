"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useCallback } from "react";
import type { EventData } from "@/lib/data";
import { categoryColors } from "@/lib/data";

const CAT_INITIAL: Record<string, string> = {
  Muzyka: "M", Kino: "K", Sztuka: "S", Sport: "Sp",
  Teatr: "T", Warsztaty: "W", Konferencje: "Kf", Jedzenie: "J", Inne: "I",
};

function createCategoryMarker(category: string) {
  const colors = categoryColors[category] ?? categoryColors.Inne;
  return L.divIcon({
    html: `<span style="
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 99px;
      background: ${colors.bg}; color: ${colors.fg};
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-size: 13px; font-weight: 800; line-height: 1;
      border: 2px solid white;
    ">${CAT_INITIAL[category] ?? "?"}</span>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function MapAnimator({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.5 });
  }, [center[0], center[1], zoom, map]);
  return null;
}

function MapRefCapture({ onMap }: { onMap: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMap(map); }, [map, onMap]);
  return null;
}

export default function LeafletMap({
  center,
  events,
  selectedDistrict,
  onBack,
}: {
  center: [number, number];
  events: EventData[];
  selectedDistrict: string;
  onBack: () => void;
}) {
  const filtered = events.filter((e) => e.district === selectedDistrict && e.coordsX);
  const mapRef = useRef<L.Map | null>(null);
  const initialCenter: [number, number] = [52.408, 16.934];
  const initialZoom = 12;

  const captureMap = useCallback((m: L.Map) => { mapRef.current = m; }, []);

  const handleBack = () => {
    const m = mapRef.current;
    if (m) {
      m.flyTo(initialCenter, initialZoom, { duration: 0.6, easeLinearity: 0.5 });
      setTimeout(onBack, 600);
    } else {
      onBack();
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <button
        onClick={handleBack}
        style={{
          position: "absolute", top: 54, left: 16, zIndex: 1000,
          padding: "8px 16px", borderRadius: 99, border: 0,
          background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
          fontSize: "var(--text-sm)", fontWeight: 600,
          boxShadow: "var(--shadow-md)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Wszystkie dzielnice
      </button>

      {filtered.length === 0 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 1000, background: "var(--bg-elev)", boxShadow: "var(--shadow-lg)",
          padding: "16px 24px", borderRadius: 16, textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            Brak wydarzeń w tej dzielnicy
          </p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", margin: "4px 0 0" }}>
            Sprawdź inną lub wróć do przeglądu
          </p>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <MapRefCapture onMap={captureMap} />
        <MapAnimator center={center} zoom={14} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.coordsX!, ev.coordsY!]}
            icon={createCategoryMarker(ev.category)}
          >
            <Popup>
              <a
                href={`/event/${ev.id}`}
                style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--ink)", textDecoration: "none" }}
              >
                {ev.title}
              </a>
              <br />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                {ev.placeName} · {ev.time ?? ""}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
