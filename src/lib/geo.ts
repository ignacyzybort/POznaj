// Point-in-polygon for determining district from coordinates
import districtGeojson from "@/lib/poznan-districts.json";

const GEO_NAME_TO_ID: Record<string, string> = {
  Centrum: "Centrum", "Stare Miasto": "StareMiasto",
  "Nowe Miasto": "NoweMiasto", Jeżyce: "Jezyce",
  Grunwald: "Grunwald", Wilda: "Wilda",
};

// Pre-extracted polygon rings for fast lookup
interface DistrictRing {
  id: string;
  ring: [number, number][];
}

const rings: DistrictRing[] = [];
for (const f of (districtGeojson as any).features ?? []) {
  const id = GEO_NAME_TO_ID[f?.properties?.name] ?? f?.properties?.name ?? "";
  if (!id) continue;
  const g = f.geometry;
  if (!g) continue;
  const coords: number[][][] = g.type === "Polygon"
    ? g.coordinates
    : g.type === "MultiPolygon"
      ? g.coordinates.flat()
      : [];
  for (const ring of coords) {
    if (ring.length < 3) continue;
    rings.push({ id, ring: ring.map(([lon, lat]: number[]) => [lat, lon]) });
  }
}

function rayCast(lat: number, lon: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect = ((yi > lat) !== (yj > lat))
      && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInDistrict(lat: number, lon: number): string | null {
  for (const { id, ring } of rings) {
    if (rayCast(lat, lon, ring)) return id;
  }
  return null;
}
