// Nominatim geocoding for unknown venues — free, no API key, 1 req/sec
import axios from "axios";

const BASE = "https://nominatim.openstreetmap.org";

// Rate limiter: max 1 request per second
let lastRequest = 0;
async function rateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastRequest));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

// In-memory cache: venue name → coords
const cache = new Map<string, { lat: number; lon: number; district: string } | null>();

// District centers — fallback when geocoding fails
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  Centrum: [52.406, 16.918],
  StareMiasto: [52.430, 16.940],
  NoweMiasto: [52.380, 16.970],
  Jezyce: [52.418, 16.895],
  Grunwald: [52.390, 16.870],
  Wilda: [52.381, 16.923],
};

function guessDistrictFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("stary rynek") || lower.includes("centrum") || lower.includes("śródmieście")) return "Centrum";
  if (lower.includes("jeżyce") || lower.includes("jezyce") || lower.includes("rynek jeżycki")) return "Jezyce";
  if (lower.includes("grunwald") || lower.includes("łazarz") || lower.includes("lazarz")) return "Grunwald";
  if (lower.includes("wilda")) return "Wilda";
  if (lower.includes("rataje") || lower.includes("malta") || lower.includes("nowe miasto") || lower.includes("śródka")) return "NoweMiasto";
  if (lower.includes("piątkowo") || lower.includes("piatkowo") || lower.includes("winogrady") || lower.includes("cytadela")) return "StareMiasto";
  return "Inny";
}

/**
 * Geocode a venue name/address using Nominatim.
 * Returns { lat, lon, district } or null if not found.
 * District is guessed from the Nominatim display_name or fallback text.
 */
export async function geocodeVenue(name: string, fallbackText?: string): Promise<{ lat: number; lon: number; district: string } | null> {
  const key = name.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const searchText = `${name}, Poznań, Polska`;

  try {
    await rateLimit();
    const res = await axios.get(`${BASE}/search`, {
      params: { q: searchText, format: "json", limit: 1, addressdetails: 1 },
      headers: { "User-Agent": "POznaj/1.0 (hello@poznaj.app) event-scraper" },
      timeout: 5000,
    });

    if (!Array.isArray(res.data) || res.data.length === 0) {
      cache.set(key, null);
      return null;
    }

    const r = res.data[0];
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);

    if (isNaN(lat) || isNaN(lon)) {
      cache.set(key, null);
      return null;
    }

    // Try to extract district from Nominatim address
    const addr = r.address ?? {};
    const districtFromOSM = guessDistrictFromText(
      [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district, r.display_name]
        .filter(Boolean).join(" ")
    );

    const district = districtFromOSM !== "Inny" ? districtFromOSM : guessDistrictFromText(fallbackText ?? name);

    const result = { lat, lon, district };
    cache.set(key, result);
    console.log(`[Geocode] ${name} → ${lat.toFixed(4)}, ${lon.toFixed(4)} (${district})`);
    return result;

  } catch {
    cache.set(key, null);
    return null;
  }
}

/**
 * Fallback: place event at district center based on guessed district.
 */
export function districtFallback(district: string): { lat: number; lon: number; district: string } {
  const center = DISTRICT_CENTERS[district] ?? [52.408, 16.934];
  return { lat: center[0], lon: center[1], district };
}
