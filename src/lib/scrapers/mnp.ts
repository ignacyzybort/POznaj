import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibesForCategory } from "@/lib/vibes";

const URL = "https://mnp.art.pl/wystawy-i-wydarzenia";
const SOURCE = "mnp";

const OOT = new Set(["gołuchów", "gołuch", "rogalin", "śmiełów", "żerków"]);

const CAT_MAP: Record<string, string> = {
  wystawa: "Sztuka",
  koncert: "Muzyka",
  warsztat: "Warsztaty",
  wykład: "Konferencje",
  spotkanie: "Inne",
  projekcja: "Kino",
  spektakl: "Teatr",
  oprowadzanie: "Inne",
  spacer: "Inne",
  kurs: "Warsztaty",
};

const MONTHS_PL: Record<string, number> = {
  stycznia: 0, lutego: 1, marca: 2, kwietnia: 3, maja: 4, czerwca: 5,
  lipca: 6, sierpnia: 7, wrzesnia: 8, pazdziernika: 9, listopada: 10, grudnia: 11,
};

function parseDatePl(dateStr: string): Date | null {
  const m = dateStr.match(/(\d{1,2})\s+(\w+)\s*(?:,\s*(\d{4}))?/);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = MONTHS_PL[m[2].toLowerCase()];
  const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
  if (month === undefined || isNaN(day) || isNaN(year)) return null;
  return new Date(year, month, day, 12);
}

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, cat] of Object.entries(CAT_MAP)) {
    if (lower.includes(kw)) return cat;
  }
  return "Inne";
}

export class MnpScraper implements Scraper {
  name = "mnp";

  async scrape(): Promise<ScrapedEvent[]> {
    console.log("[MNP] Fetching...");
    const { data } = await axios.get(URL, { headers: { "User-Agent": "POznaj/1.0" }, timeout: 20000 });
    const $ = cheerio.load(data);

    const events: ScrapedEvent[] = [];
    const seen = new Set<string>();

    // Look for event entries — the page shows events in structured blocks
    // Each event block typically has a title link, date, venue, address, category tag
    const selectors = [
      "[class*='event']", "[class*='wydarzenie']", ".tribe-events-calendar-list__event",
      "article", "[class*='list-item']", "[class*='entry']",
    ];

    $("body *").each((_, el) => {
      // Look for venue text patterns to identify event containers
      const text = $(el).text().trim();
      if (text.length < 30 || text.length > 3000) return;

      // Check if this element contains a date + venue pattern
      if (!/\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|wrzesnia|pazdziernika|listopada|grudnia)/.test(text)) return;

      // Extract title from the first heading or link
      const titleEl = $(el).find("h2, h3, h4, .title, [class*='title'], a[href*='wydarzenie']").first();
      const title = titleEl.text().trim() || text.split("\n")[0]?.trim() || "";
      if (title.length < 5) return;
      // Skip date-only titles (false positive matches)
      if (/^\d{1,2}\s+\w+(?:\s+\d{4})?(?:\s+\d{1,2}:\d{2})?/.test(title) && title.length < 60) return;

      // Extract dates
      const dateMatch = text.match(/(\d{1,2}\s+\w+)(?:\s*,\s*\d{4})?.*?(\d{1,2}\s+\w+)(?:\s*,\s*\d{4})?/);
      const singleDateMatch = text.match(/(\d{1,2}\s+\w+(?:\s*,\s*\d{4})?)/);

      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (dateMatch) {
        startDate = parseDatePl(dateMatch[1]);
        endDate = parseDatePl(dateMatch[2]);
      } else if (singleDateMatch) {
        startDate = parseDatePl(singleDateMatch[1]);
        endDate = startDate;
      }

      if (!startDate) return;

      // Past events
      if (endDate && endDate < new Date()) return;

      // Extract time
      const timeMatch = text.match(/(\d{1,2}:\d{2})/);
      const time = timeMatch?.[1];

      // Extract venue/address
      const venueMatch = text.match(/(Muzeum\s+[^.]+?(?:w\s+Poznaniu|w\s+Zamku|w\s+Gołuchowie|w\s+Rogalinie|w\s+Śmiełowie|Ratusz[^.]+))/i);
      const addressMatch = text.match(/((?:ul\.|Aleje|pl\.|Plac)\s+[^,]+(?:\s+\d+\w?)?)/i);

      const placeName = venueMatch?.[1]?.trim() || "";
      const address = addressMatch?.[1]?.trim() || "";

      // Skip out-of-town venues
      const lowerPlace = placeName.toLowerCase();
      if (OOT.has(lowerPlace) || [...OOT].some((o) => lowerPlace.includes(o))) return;

      // Extract description
      const descMatch = text.match(/(?:Zapraszamy|Wystawa|Pokaz|Warsztaty|Koncert|Spotkanie|Wykład|Oprowadzanie)[^.]+[^.]*\.(?:\s+[^.]+\.){0,2}/i);
      const description = title + (descMatch ? ". " + descMatch[0] : "");

      // Category
      const categoryMatch = text.match(/(wystawa|koncert|warsztat|wykład|spotkanie|projekcja|spektakl|oprowadzanie|spacer|kurs)/i);
      const category = categoryMatch ? guessCategory(categoryMatch[1]) : "Inne";

      const key = `${title}|${placeName}|${startDate.toISOString().slice(0, 10)}`;
      if (seen.has(key)) return;
      seen.add(key);

      const venue = matchVenue(placeName || text);
      const geo = venue || districtFallback("Centrum");

      events.push({
        title,
        description,
        sourceUrl: URL,
        startDate,
        endDate: endDate || startDate,
        time,
        placeName: placeName || "Muzeum Narodowe w Poznaniu",
        address,
        district: geo.district,
        category,
        vibes: guessVibesForCategory(category),
        source: SOURCE,
        sourceId: `mnp/${key}`,
        coordsX: geo.lat,
        coordsY: geo.lon,
        outdoor: false,
      });
    });

    // Post-geocode unmatched
    for (const ev of events) {
      if (!ev.coordsX && ev.placeName) {
        try {
          const geo = await geocodeVenue(`${ev.placeName}, Poznań`);
          if (geo) {
            ev.coordsX = geo.lat;
            ev.coordsY = geo.lon;
            ev.district = geo.district;
          }
        } catch { /* keep fallback */ }
      }
    }

    return events;
  }
}
