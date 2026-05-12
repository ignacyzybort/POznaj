"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { EventData } from "@/lib/data";

function createIcon(emoji: string) {
  return L.divIcon({
    html: `<span style="font-size:22px">${emoji}</span>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
  return (
    <div style={{ position: "absolute", inset: 0, animation: "pz-fade-in 0.3s ease both" }}>
      <button
        onClick={onBack}
        style={{
          position: "absolute", top: 54, left: 16, zIndex: 1000,
          padding: "8px 16px", borderRadius: 99, border: 0,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
          color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 600,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Wszystkie dzielnice
      </button>

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
        {events
          .filter((e) => e.district === selectedDistrict && e.coordsX)
          .map((ev) => (
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
