"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { EventData } from "@/lib/data";

function createIcon(emoji: string) {
  return L.divIcon({
    html: `<span style="
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 99px;
      background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-size: 18px; line-height: 1;
    ">${emoji}</span>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
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

  return (
    <div style={{ position: "absolute", inset: 0, animation: "pz-fade-in 0.3s ease both" }}>
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 54, left: 16, zIndex: 1000,
          padding: "8px 16px", borderRadius: 99, border: 0,
          background: "rgba(20,19,15,0.85)", backdropFilter: "blur(12px)",
          color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Wszystkie dzielnice
      </button>

      {filtered.length === 0 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          zIndex: 1000, background: "rgba(20,19,15,0.9)", backdropFilter: "blur(12px)",
          padding: "16px 24px", borderRadius: 16, textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>
            Brak wydarzeń w tej dzielnicy
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "4px 0 0" }}>
            Sprawdź inną lub wróć do przeglądu
          </p>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.coordsX!, ev.coordsY!]}
            icon={createIcon("🎵")}
          >
            <Popup>
              <a
                href={`/event/${ev.id}`}
                style={{ fontWeight: 700, fontSize: 13, color: "#14130F", textDecoration: "none" }}
              >
                {ev.title}
              </a>
              <br />
              <span style={{ fontSize: 11, color: "#888" }}>
                {ev.placeName} · {ev.time ?? ""}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
