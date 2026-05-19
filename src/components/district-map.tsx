"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
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

function createCategoryMarker(category: string, index: number) {
  const colors = categoryColors[category] ?? categoryColors.Inne;
  return L.divIcon({
    html: `<span role="img" aria-label="Wydarzenie: ${category}" style="
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 99px;
      background: ${colors.bg}; color: ${colors.fg};
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-size: 13px; font-weight: 800; line-height: 1;
      border: 2px solid white;
      animation: pz-pop 0.3s var(--ease-spring) both;
      animation-delay: ${index * 60}ms;
    ">${CAT_INITIAL[category] ?? "?"}</span>`,
    className: "", iconSize: [44, 44], iconAnchor: [22, 22],
  });
}

function getStyle(id: string, isSelected: boolean, hasSelection: boolean, count: number, maxCount: number) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const hue = DISTRICT_HUES[id] ?? 0;
  const sat = isSelected ? 40 : 50 + Math.round(25 * ratio);
  const lit = isSelected ? 50 : 48 - Math.round(18 * ratio);
  const opacity = isSelected ? 0.06 : hasSelection ? 0.08 : 0.28;
  return {
    fillColor: `hsl(${hue}, ${sat}%, ${lit}%)`,
    fillOpacity: opacity,
    color: isSelected ? "white" : "rgba(255,255,255,0.45)",
    weight: isSelected ? 3 : 1.2,
  };
}

function getHue(id: string): number {
  return DISTRICT_HUES[id] ?? 0;
}

function MapController({ selected, eventCounts, geoRef }: { selected: string | null; eventCounts: Record<string, number>; geoRef: React.RefObject<L.GeoJSON | null> }) {
  const map = useMap();
  const prevSelected = useRef(selected);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Fix 2: smoother flyTo with eased camera movement */
  useEffect(() => {
    if (selected && DISTRICT_CENTERS[selected]) {
      map.flyTo(DISTRICT_CENTERS[selected], 14, { duration: 1.2, easeLinearity: 0.1 });
    } else {
      map.flyTo([52.408, 16.934], 11, { duration: 1.2, easeLinearity: 0.1 });
    }
  }, [selected, map]);

  /* Fix 3: district glow pulse when selection changes */
  useEffect(() => {
    if (!geoRef?.current) return;
    if (glowTimer.current) clearTimeout(glowTimer.current);

    /* Remove glow from all layers first */
    geoRef.current.eachLayer((layer) => {
      const el = (layer as any).getElement?.();
      if (el) L.DomUtil.removeClass(el, "pz-district-glow");
    });

    /* Apply glow to newly selected district */
    if (selected) {
      geoRef.current.eachLayer((layer) => {
        const feat = (layer as any).feature;
        if (!feat) return;
        const id = getId(feat);
        if (id === selected) {
          const el = (layer as any).getElement?.();
          if (el) L.DomUtil.addClass(el, "pz-district-glow");
        }
      });
      glowTimer.current = setTimeout(() => {
        geoRef.current?.eachLayer((layer) => {
          const el = (layer as any).getElement?.();
          if (el) L.DomUtil.removeClass(el, "pz-district-glow");
        });
      }, 600);
    }

    return () => {
      if (glowTimer.current) clearTimeout(glowTimer.current);
    };
  }, [selected, geoRef]);

  /* Update district fill styles based on event counts */
  useEffect(() => {
    if (!geoRef?.current) return;
    const maxCount = Math.max(...Object.values(eventCounts), 1);
    geoRef.current.eachLayer((layer) => {
      const feat = (layer as any).feature;
      if (!feat) return;
      const id = getId(feat);
      const isSelected = id === selected;
      const count = eventCounts[id] ?? 0;
      (layer as L.Path).setStyle(getStyle(id, isSelected, !!selected && !isSelected, count, maxCount));
    });
  }, [selected, eventCounts, geoRef]);

  return null;
}

function DistrictBoundary() {
  const map = useMap();
  useEffect(() => {
    const dark = L.polygon(
      [[-90, -180], [-90, 180], [90, 180], [90, -180]],
      { color: "#111", fillColor: "#111", fillOpacity: 0.75, weight: 0, interactive: false }
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

function relDay(d: Date): string {
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === now.toDateString()) return "Dziś";
  if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
  return d.toLocaleDateString("pl", { day: "numeric", month: "short" });
}

export default function DistrictMap({
  events, selectedDistrict, onSelect, onBack,
}: {
  events: EventData[];
  selectedDistrict: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const [tilesVisible, setTilesVisible] = useState(false);
  const geoRef = useRef<L.GeoJSON | null>(null);
  const router = useRouter();

  const handleSelect = (id: string) => { onSelect(id); setTilesVisible(true); };
  const handleBack = () => { onBack(); setTilesVisible(false); };

  const eventCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) {
      if (!e.coordsX) continue;
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
    const count = eventCounts[id] ?? 0;
    const name = feature?.properties?.name ?? id;

    layer.on({
      click: () => { if (id) handleSelect(id); },
      mouseover: (e) => { (e.target as L.Path).setStyle({ weight: 4, color: "white" }); },
      mouseout: (e) => {
        const isSelected = id === selectedDistrict;
        (e.target as L.Path).setStyle(getStyle(id, isSelected, !!selectedDistrict && !isSelected, count, maxCount));
      },
    });

    // Permanent district label with event count, colored by district hue
    if (id && !selectedDistrict) {
      const hue = DISTRICT_HUES[id] ?? 0;
      const labelColor = `hsl(${hue}, 60%, 72%)`;
      const label = count > 0
        ? `<span style="font-size: var(--text-sm); font-weight: 700; color: ${labelColor}; text-shadow: 0 0 6px var(--bg);">${name}<span style="font-size: var(--text-xs); font-weight: 600; opacity: 0.7; margin-left: 4px;">${count}</span></span>`
        : `<span style="font-size: var(--text-sm); font-weight: 700; color: ${labelColor}; text-shadow: 0 0 6px var(--bg);">${name}</span>`;
      layer.bindTooltip(label, {
        permanent: true, direction: "center", className: "pz-map-tooltip",
        opacity: 0.85,
      });
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Back button — bottom-left, thumb-reachable */}
      {selectedDistrict && (
        <button onClick={handleBack} style={{
          position: "absolute",           bottom: "calc(170px + var(--safe-b))", left: "calc(14px + var(--safe-l))",
          zIndex: 1000, gap: 6, alignItems: "center",
          padding: "8px 18px", borderRadius: 99, border: 0,
          background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
          fontSize: "var(--text-sm)", fontWeight: 600,
          boxShadow: "var(--shadow-md)", display: "inline-flex",
          backdropFilter: "blur(12px)",
        }}>
          <BackIcon size={16} /> Dzielnice
        </button>
      )}

      <MapContainer
        center={[52.408, 16.934]}
        zoom={11}
        minZoom={10}
        maxBounds={[[52.30, 16.75], [52.50, 17.10]]}
        style={{ width: "100%", height: "100%", background: "#111" }}
        zoomControl={true}
      >
        <DistrictBoundary />
        {tilesVisible && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        <MapController selected={selectedDistrict} eventCounts={eventCounts} geoRef={geoRef} />
        {districtGeojson && (
          <GeoJSON
            ref={geoRef}
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
        {filteredEvents.map((ev, i) => (
          <Marker
            key={ev.id}
            position={[ev.coordsX!, ev.coordsY!]}
            icon={createCategoryMarker(ev.category, i)}
          >
            <Popup>
              <div
                onClick={() => router.push(`/event/${ev.id}`)}
                style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--ink)", cursor: "pointer", textDecoration: "none" }}>
                {ev.title}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>
                {ev.placeName} · {ev.time ?? ""}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Empty district message */}
      {selectedDistrict && filteredEvents.length === 0 && (
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
          <span style={{ padding: "8px 16px", borderRadius: 99, background: "var(--bg-elev)", color: "var(--ink-3)", fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-md)" }}>
            Brak wydarzeń w tej dzielnicy
          </span>
        </div>
      )}

      {/* Floating event stack when district selected */}
      {selectedDistrict && filteredEvents.length > 0 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          zIndex: 1000, padding: "14px 18px calc(20px + var(--safe-b))",
          background: "linear-gradient(180deg, transparent, var(--bg) 25%)",
        }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 36, touchAction: "pan-x" }}>
            {filteredEvents.slice(0, 8).map((ev) => (
              <div
                key={ev.id}
                onClick={() => router.push(`/event/${ev.id}`)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { router.push(`/event/${ev.id}`); } }}
                style={{
                  flex: "0 0 160px", borderRadius: 18, overflow: "hidden",
                  position: "relative", height: 120, cursor: "pointer",
                  boxShadow: "var(--shadow-md)",
                  transition: "transform 0.2s var(--ease-out-quart)",
                }}
              >
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--stone)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "var(--ink-4)" }}>{ev.category?.[0] ?? "?"}</div>
                )}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8px 10px 6px", background: "linear-gradient(180deg, transparent, rgba(20,19,15,0.8))" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "white", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.time ?? relDay(new Date(ev.startDate))} · {ev.placeName}</p>
                </div>
              </div>
            ))}
            {filteredEvents.length > 8 && (
              <div role="button" tabIndex={0} style={{ flex: "0 0 100px", borderRadius: 18, height: 120, background: "var(--bg-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-3)" }}>+{filteredEvents.length - 8} więcej</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
