"use client";

import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useCallback, useState } from "react";
import type { EventData } from "@/lib/data";
import { categoryColors } from "@/lib/data";
import districtGeojson from "@/lib/poznan-districts.json";

const CAT_INITIAL: Record<string, string> = {
  Muzyka: "M", Kino: "K", Sztuka: "S", Sport: "Sp",
  Teatr: "T", Warsztaty: "W", Konferencje: "Kf", Jedzenie: "J", Inne: "I",
};

const GEO_NAME_TO_ID: Record<string, string> = {
  "Centrum": "Centrum", "Stare Miasto": "StareMiasto",
  "Nowe Miasto": "NoweMiasto", "Jeżyce": "Jezyce",
  "Grunwald": "Grunwald", "Wilda": "Wilda",
};

const ID_TO_NAME = Object.fromEntries(
  Object.entries(GEO_NAME_TO_ID).map(([k, v]) => [v, k])
);

function getId(feature: any): string {
  return GEO_NAME_TO_ID[feature?.properties?.name] ?? feature?.properties?.name ?? "";
}

const DISTRICT_HUES: Record<string, number> = {
  Centrum: 30, StareMiasto: 340, NoweMiasto: 220,
  Jezyce: 35, Grunwald: 120, Wilda: 280,
  Inny: 0,
};

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  Centrum: [52.406, 16.918], StareMiasto: [52.430, 16.940],
  NoweMiasto: [52.380, 16.970], Jezyce: [52.418, 16.895],
  Grunwald: [52.390, 16.870], Wilda: [52.381, 16.923],
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
    className: "", iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function MapController({ selected, onDistrictClick, eventCounts }:
  { selected: string | null; onDistrictClick: (id: string) => void; eventCounts: Record<string, number> }) {
  const map = useMap();
  const geojsonRef = useRef<L.GeoJSON | null>(null);
  const zoomed = useRef(false);

  useEffect(() => {
    if (selected && DISTRICT_CENTERS[selected]) {
      map.flyTo(DISTRICT_CENTERS[selected], 14, { duration: 1.0 });
      zoomed.current = true;
    } else {
      map.flyTo([52.408, 16.934], 11, { duration: 0.6 });
      zoomed.current = false;
    }
  }, [selected, map]);

  useEffect(() => {
    if (!geojsonRef.current) return;
    geojsonRef.current.eachLayer((layer) => {
      const feat = (layer as any).feature;
      if (!feat) return;
      const id = getId(feat);
      const isSelected = id === selected;
      const count = eventCounts[id] ?? 0;
      const maxCount = Math.max(...Object.values(eventCounts), 1);
      const ratio = count / maxCount;
      const hue = DISTRICT_HUES[id] ?? 0;
      const sat = 55 + Math.round(20 * ratio);
      const lit = 45 - Math.round(15 * ratio);
      (layer as L.Path).setStyle({
        fillColor: isSelected ? `hsl(${hue}, 70%, 55%)` : `hsl(${hue}, ${sat}%, ${lit}%)`,
        fillOpacity: isSelected ? 0.9 : 0.7,
        color: isSelected ? "white" : "rgba(255,255,255,0.6)",
        weight: isSelected ? 4 : 2,
      });
    });
  }, [selected, eventCounts]);

  return null;
}

export default function DistrictMap({
  events, selectedDistrict, onSelect, onBack,
}: {
  events: EventData[];
  selectedDistrict: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [geojsonData, setGeojsonData] = useState<any>(null);

  useEffect(() => {
    setGeojsonData(districtGeojson);
    const c: Record<string, number> = {};
    for (const e of events) {
      c[e.district] = (c[e.district] ?? 0) + 1;
    }
    setEventCounts(c);
  }, [events]);

  const filteredEvents = selectedDistrict
    ? events.filter((e) => e.district === selectedDistrict && e.coordsX)
    : [];

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const id = getId(feature);
    layer.on({
      click: () => { if (id) onSelect(id); },
      mouseover: (e) => { (e.target as L.Path).setStyle({ weight: 4, color: "white" }); },
      mouseout: (e) => {
        const selected = id === selectedDistrict;
        (e.target as L.Path).setStyle({ weight: selected ? 4 : 2, color: selected ? "white" : "rgba(255,255,255,0.6)" });
      },
    });
    // Tooltip with district name
    if (id) {
      layer.bindTooltip(feature?.properties?.name ?? id, { sticky: true, direction: "center" });
    }
  };

  const pointToLayer = (feature: any, latlng: L.LatLngExpression) => {
    const id = getId(feature);
    const count = eventCounts[id] ?? 0;
    const maxCount = Math.max(...Object.values(eventCounts), 1);
    const ratio = count / maxCount;
    const hue = DISTRICT_HUES[id] ?? 0;
    const sat = 55 + Math.round(20 * ratio);
    const lit = 45 - Math.round(15 * ratio);
    return L.polygon([], {
      fillColor: `hsl(${hue}, ${sat}%, ${lit}%)`,
      fillOpacity: 0.7,
      color: "rgba(255,255,255,0.6)",
      weight: 2,
    });
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {selectedDistrict && (
        <button onClick={onBack} style={{
          position: "absolute", top: 54, left: 16, zIndex: 1000,
          padding: "8px 16px", borderRadius: 99, border: 0,
          background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
          fontSize: "var(--text-sm)", fontWeight: 600,
          boxShadow: "var(--shadow-md)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Wszystkie dzielnice
        </button>
      )}

      <MapContainer
        center={[52.408, 16.934]}
        zoom={11}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <MapController selected={selectedDistrict} onDistrictClick={onSelect} eventCounts={eventCounts} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geojsonData && (
          <GeoJSON
            key={selectedDistrict ?? "all"}
            data={geojsonData}
            onEachFeature={onEachFeature}
            style={(feature) => {
              const id = getId(feature ?? {});
              const isSelected = id === selectedDistrict;
              const count = eventCounts[id] ?? 0;
              const maxCount = Math.max(...Object.values(eventCounts), 1);
              const ratio = count / maxCount;
              const hue = DISTRICT_HUES[id] ?? 0;
              const sat = 55 + Math.round(20 * ratio);
              const lit = 45 - Math.round(15 * ratio);
              return {
                fillColor: isSelected ? `hsl(${hue}, 70%, 55%)` : `hsl(${hue}, ${sat}%, ${lit}%)`,
                fillOpacity: isSelected ? 0.9 : 0.7,
                color: isSelected ? "white" : "rgba(255,255,255,0.6)",
                weight: isSelected ? 4 : 2,
              };
            }}
          />
        )}
        {filteredEvents.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.coordsX!, ev.coordsY!]}
            icon={createCategoryMarker(ev.category)}
          >
            <Popup>
              <a href={`/event/${ev.id}`}
                style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--ink)", textDecoration: "none" }}>
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
