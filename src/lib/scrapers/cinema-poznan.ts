import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibesForCategory } from "@/lib/vibes";
import { fetchMoviePoster } from "@/lib/tmdb";
import { dateKeyInWarsaw, warsawDate } from "./text";

const BASE = "https://www.poznan.pl/mim/events/seances";
const SOURCE = "poznan-cinema";
const DAYS_AHEAD = 7;
const GEOCODE_CACHE = new Map<string, { lat: number; lon: number; district: string }>();

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** Try name variants for venues stored with the city suffix ("Cinema City Poznań - Plaza"). */
function venueCandidates(name: string): string[] {
  const stripped = name
    .replace(/Poznań/gi, " ").replace(/\bPoznan\b/gi, " ")
    .replace(/\s*[-–—/]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return [...new Set([name, stripped, name.replace(/^Kino\s+/i, ""), stripped.replace(/^Kino\s+/i, "")])].filter(Boolean);
}

async function resolveVenue(name: string) {
  for (const candidate of venueCandidates(name)) {
    const venue = matchVenue(candidate);
    if (venue) return venue;
  }

  const cached = GEOCODE_CACHE.get(name);
  if (cached) return cached;

  // Always return coordinates: a cinema without coords used to end up with 156
  // DB rows missing geo data (and a district that disagreed with the polygon).
  let resolved: { lat: number; lon: number; district: string };
  try {
    const geo =
      (await geocodeVenue(`${name}, Poznań`)) ??
      (await geocodeVenue(`${venueCandidates(name)[1] ?? name}, Poznań`));
    resolved = geo ?? districtFallback("Centrum");
  } catch {
    resolved = districtFallback("Centrum");
  }
  GEOCODE_CACHE.set(name, resolved);
  return resolved;
}

interface Screening {
  title: string;
  time: string;
}

function timeSortKey(t: string): number {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.MAX_SAFE_INTEGER;
}

export class PoznanCinemaScraper implements Scraper {
  name = "poznan-cinema";

  async scrape(): Promise<ScrapedEvent[]> {
    const today = new Date();
    const allGrouped: Map<string, ScrapedEvent> = new Map();

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = fmtDate(d);
      const url = `${BASE}/${dateStr}/`;
      const dayStart = warsawDate(d.getFullYear(), d.getMonth(), d.getDate(), 12);

      console.log(`[Cinema] Fetching ${dateStr}...`);
      let $: cheerio.CheerioAPI;
      try {
        const { data } = await axios.get(url, { headers: { "User-Agent": "POznaj/1.0" }, timeout: 15000 });
        $ = cheerio.load(data);
      } catch {
        console.warn(`[Cinema] Failed to fetch ${dateStr}, skipping`);
        continue;
      }

      const h3s = $("h3").toArray();
      for (const h3El of h3s) {
        const cinemaAnchor = $(h3El).find("a").first();
        const cinemaName = cinemaAnchor.text().trim();
        if (!cinemaName) continue;

        const ulEl = $(h3El).next("ul");
        if (!ulEl.length) continue;

        const screenings: Screening[] = [];
        ulEl.find("li").each((_, li) => {
          const dateDiv = $(li).find(".date span").text().trim();
          const timeDiv = $(li).find(".time").text().trim();
          const titleAnchor = $(li).find(".name a").first();
          const title = titleAnchor.text().trim();

          if (dateDiv !== dateStr) return;
          if (!timeDiv || !title) return;

          screenings.push({ title, time: timeDiv });
        });

        if (screenings.length === 0) continue;

        // Group by film title within this cinema+date
        const filmGroups = new Map<string, string[]>();
        for (const s of screenings) {
          const times = filmGroups.get(s.title) ?? [];
          times.push(s.time);
          filmGroups.set(s.title, times);
        }

        for (const [filmTitle, times] of filmGroups) {
          times.sort((a, b) => timeSortKey(a) - timeSortKey(b));
          const groupKey = `poznan-cinema/${cinemaName}/${dateStr}/${filmTitle}`.toLowerCase();
          const existing = allGrouped.get(groupKey);
          if (existing) {
            // Merge times (same film at same cinema on same date)
            const merged = [...new Set([...existing.time!.split(", "), ...times])];
            merged.sort((a, b) => timeSortKey(a) - timeSortKey(b));
            existing.time = merged.join(", ");
          } else {
            const geo = await resolveVenue(cinemaName);
            allGrouped.set(groupKey, {
              title: filmTitle,
              description: `Seans kinowy — ${cinemaName}`,
              sourceUrl: url,
              startDate: dayStart,
              endDate: warsawDate(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59),
              time: times.join(", "),
              placeName: cinemaName,
              district: geo.district,
              category: "Kino",
              vibes: guessVibesForCategory("Kino"),
              source: SOURCE,
              sourceId: groupKey,
              coordsX: geo.lat,
              coordsY: geo.lon,
              outdoor: false,
            });
          }
        }
      }
    }

    const events = Array.from(allGrouped.values());

    // Resolve TMDB posters — 1 API call per unique film title, bounded concurrency
    const uniqueTitles = Array.from(new Set(events.map((e) => e.title)));
    console.log(`[Cinema] ${events.length} events, ${uniqueTitles.length} unique titles; fetching posters...`);

    const posters = new Map<string, string | null>();
    let cursor = 0;
    const WORKERS = 8;
    await Promise.all(
      Array.from({ length: WORKERS }, async () => {
        while (cursor < uniqueTitles.length) {
          const title = uniqueTitles[cursor++];
          posters.set(title, await fetchMoviePoster(title));
          if (cursor % 100 === 0) {
            console.log(`[Cinema] posters ${cursor}/${uniqueTitles.length}`);
          }
        }
      })
    );

    for (const e of events) {
      const poster = posters.get(e.title);
      if (poster) e.imageUrl = poster;
    }

    console.log(`[Cinema] Posters resolved: ${Array.from(posters.values()).filter(Boolean).length}/${uniqueTitles.length}`);

    // Debug guard: every cinema event must be locatable for the map.
    const missing = events.filter((e) => e.coordsX == null || e.coordsY == null);
    if (missing.length > 0) {
      console.warn(`[Cinema] ${missing.length} events still missing coordinates; using district fallback`);
      for (const e of missing) {
        const center = districtFallback(e.district);
        e.coordsX = center.lat;
        e.coordsY = center.lon;
      }
    }

    // Keep only today/future seances (timezone-safe via Warsaw date keys).
    const todayKey = dateKeyInWarsaw(new Date());
    return events.filter((e) => dateKeyInWarsaw(e.startDate) >= todayKey);
  }
}
