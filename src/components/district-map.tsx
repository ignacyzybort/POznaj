"use client";

import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useMemo } from "react";
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

const OLD_TO_NEW: Record<string, string> = {
  Lazarz: "Grunwald", Rataje: "NoweMiasto",
  Piatkowo: "StareMiasto", Winogrady: "StareMiasto",
};

function mapDistrict(d: string): string {
  return OLD_TO_NEW[d] ?? d;
}

const DISTRICT_HUES: Record<string, number> = {
  Centrum: 200, StareMiasto: 340, NoweMiasto: 160,
  Jezyce: 35, Grunwald: 120, Wilda: 280,
};

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  Centrum: [52.406, 16.918], StareMiasto: [52.430, 16.940],
  NoweMiasto: [52.380, 16.970], Jezyce: [52.418, 16.895],
  Grunwald: [52.390, 16.870], Wilda: [52.381, 16.923],
};

function getId(feature: any): string {
  return GEO_NAME_TO_ID[feature?.properties?.name] ?? feature?.properties?.name ?? "";
}

/** Compute approximate Poznań outer boundary from all district polygons */
function computeCityBoundary(): [number, number][] {
  const all: [number, number][] = [];
  for (const f of (districtGeojson as any).features ?? []) {
    const g = f.geometry;
    if (g?.coordinates) {
      const coords = g.type === "Polygon" ? g.coordinates[0] : g.coordinates.flat()[0];
      for (const c of coords) all.push([c[1], c[0]]);
    }
  }
  if (all.length < 3) return [];
  // Simple convex hull (Graham scan)
  const start = all.reduce((a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? a : b);
  const sorted = all.filter((p) => p !== start).sort((a, b) => {
    const cross = (a[0] - start[0]) * (b[1] - start[1]) - (a[1] - start[1]) * (b[0] - start[0]);
    return cross !== 0 ? -cross : (a[0] - start[0]) ** 2 + (a[1] - start[1]) ** 2 - (b[0] - start[0]) ** 2 - (b[1] - start[1]) ** 2;
  });
  const hull: [number, number][] = [start];
  for (const p of sorted) {
    while (hull.length > 1 && (hull[hull.length - 1][0] - hull[hull.length - 2][0]) * (p[1] - hull[hull.length - 2][1]) - (hull[hull.length - 1][1] - hull[hull.length - 2][1]) * (p[0] - hull[hull.length - 2][0]) >= 0) hull.pop();
    hull.push(p);
  }
  return hull;
}

const CITY_BOUNDARY = computeCityBoundary();

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

function getStyle(id: string, isSelected: boolean, hasSelection: boolean, count: number, maxCount: number) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const hue = DISTRICT_HUES[id] ?? 0;
  const sat = isSelected ? 65 : 55 + Math.round(20 * ratio);
  const lit = isSelected ? 55 : 45 - Math.round(15 * ratio);
  const opacity = isSelected ? 0.85 : hasSelection ? 0.15 : 0.35;
  return {
    fillColor: `hsl(${hue}, ${sat}%, ${lit}%)`,
    fillOpacity: opacity,
    color: isSelected ? "white" : "rgba(255,255,255,0.5)",
    weight: isSelected ? 4 : 1.5,
  };
}

function getHue(id: string): number {
  return DISTRICT_HUES[id] ?? 0;
}

function MapController({ selected, eventCounts }: { selected: string | null; eventCounts: Record<string, number> }) {
  const map = useMap();
  const geojsonRef = useRef<L.GeoJSON | null>(null);
  const prevSelected = useRef(selected);

  useEffect(() => {
    if (selected && DISTRICT_CENTERS[selected]) {
      map.flyTo(DISTRICT_CENTERS[selected], 14, { duration: 1.0 });
    } else {
      map.flyTo([52.408, 16.934], 11, { duration: 0.6 });
    }
  }, [selected, map]);

  useEffect(() => {
    if (!geojsonRef.current) return;
    const maxCount = Math.max(...Object.values(eventCounts), 1);
    geojsonRef.current.eachLayer((layer) => {
      const feat = (layer as any).feature;
      if (!feat) return;
      const id = getId(feat);
      const isSelected = id === selected;
      const count = eventCounts[id] ?? 0;
      (layer as L.Path).setStyle(getStyle(id, isSelected, !!selected && !isSelected, count, maxCount));
    });
  }, [selected, eventCounts]);

  return null;
}

function DistrictBoundary() {
  const map = useMap();
  useEffect(() => {
    const dark = L.polygon(
      [[-90, -180], [-90, 180], [90, 180], [90, -180]],
      { color: "#111", fillColor: "#111", fillOpacity: 1.0, weight: 0, interactive: false }
    );
    if (CITY_BOUNDARY.length > 2) {
      // Add the city boundary as a hole
      (dark as any).setLatLngs([[[-90, -180], [-90, 180], [90, 180], [90, -180]], CITY_BOUNDARY]);
    }
    dark.addTo(map);
    return () => { dark.remove(); };
  }, [map]);
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
  const eventCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) {
      const d = mapDistrict(e.district);
      c[d] = (c[d] ?? 0) + 1;
    }
    return c;
  }, [events]);

  const maxCount = useMemo(() => Math.max(...Object.values(eventCounts), 1), [eventCounts]);

  const filteredEvents = selectedDistrict
    ? events.filter((e) => mapDistrict(e.district) === selectedDistrict && e.coordsX)
    : [];

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const id = getId(feature);
    layer.on({
      click: () => { if (id) onSelect(id); },
      mouseover: (e) => { (e.target as L.Path).setStyle({ weight: 5, color: "white" }); },
      mouseout: (e) => {
        const isSelected = id === selectedDistrict;
        const count = filteredEvents.length;
        (e.target as L.Path).setStyle(getStyle(id, isSelected, !!selectedDistrict && !isSelected, count, maxCount));
      },
    });
    if (id) {
      const name = feature?.properties?.name ?? id;
      layer.bindTooltip(`<b>${name}</b>`, { sticky: true, direction: "center", className: "pz-map-tooltip" });
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {selectedDistrict && (
        <button onClick={onBack} style={{
          position: "absolute", top: 54, left: 16, zIndex: 1000,
          padding: "8px 16px", borderRadius: 99, border: 0,
          background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
          fontSize: "var(--text-sm)", fontWeight: 600,
          boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: 6,
        }}>
          ← Wszystkie dzielnice
        </button>
      )}

      <MapContainer
        center={[52.408, 16.934]}
        zoom={11}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        preferCanvas={true}
      >
        <DistrictBoundary />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController selected={selectedDistrict} eventCounts={eventCounts} />
        {districtGeojson && (
          <GeoJSON
            data={districtGeojson as any}
            onEachFeature={onEachFeature}
            style={(feature) => {
              const id = getId(feature ?? {});
              const isSelected = id === selectedDistrict;
              const count = eventCounts[id] ?? 0;
              return getStyle(id, isSelected, !!selectedDistrict && !isSelected, count, maxCount);
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
