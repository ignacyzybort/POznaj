import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibesForCategory } from "@/lib/vibes";
import { fetchMoviePoster } from "@/lib/tmdb";

const BASE = "https://www.poznan.pl/mim/events/seances";
const SOURCE = "poznan-cinema";
const DAYS_AHEAD = 7;
const GEOCODE_CACHE = new Map<string, { lat: number; lon: number; district: string } | null>();

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

async function resolveVenue(name: string) {
  let venue = matchVenue(name);
  if (venue) return venue;

  const cached = GEOCODE_CACHE.get(name);
  if (cached !== undefined) return cached;

  try {
    const geo = await geocodeVenue(`${name}, Poznań`);
    GEOCODE_CACHE.set(name, geo);
    return geo;
  } catch {
    const fallback = districtFallback("Centrum");
    GEOCODE_CACHE.set(name, fallback);
    return fallback;
  }
}

interface Screening {
  title: string;
  time: string;
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
          times.sort();
          const groupKey = `poznan-cinema/${cinemaName}/${dateStr}/${filmTitle}`.toLowerCase();
          const existing = allGrouped.get(groupKey);
          if (existing) {
            // Merge times (same film at same cinema on same date)
            const merged = [...new Set([...existing.time!.split(", "), ...times])];
            merged.sort();
            existing.time = merged.join(", ");
          } else {
            const startDate = new Date(d);
            const endDate = new Date(d);
            endDate.setHours(23, 59);

            const geo = await resolveVenue(cinemaName);

            allGrouped.set(groupKey, {
              title: filmTitle,
              description: `Seans kinowy — ${cinemaName}`,
              sourceUrl: url,
              startDate,
              endDate,
              time: times.join(", "),
              placeName: cinemaName,
              district: geo?.district || "Centrum",
              category: "Kino",
              vibes: guessVibesForCategory("Kino"),
              source: SOURCE,
              sourceId: groupKey,
              coordsX: geo?.lat,
              coordsY: geo?.lon,
              outdoor: false,
            });
          }
        }
      }
    }

    const events = Array.from(allGrouped.values());

    // Resolve TMDB posters — 1 API call per unique film title
    const uniqueTitles = new Set(events.map((e) => e.title));
    for (const title of uniqueTitles) {
      const poster = await fetchMoviePoster(title);
      if (poster) {
        for (const e of events) {
          if (e.title === title) e.imageUrl = poster;
        }
      }
    }

    return events;
  }
}
