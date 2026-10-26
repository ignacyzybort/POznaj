import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibesForCategory } from "@/lib/vibes";
import {
  classifyCategory,
  cleanPlaceName,
  htmlToText,
  parseSourceDate,
  timeInWarsaw,
} from "./text";

const PAGE_URL = "https://mnp.art.pl/wystawy-i-wydarzenia";
const SOURCE = "mnp";

// Museum branches outside Poznań are not part of the app's city feed.
const OUT_OF_TOWN = ["gołuchów", "gołuchowie", "gołuch", "rogalin", "rogalinie", "śmiełów", "smielow", "smiełow", "żerków", "zerkow"];

// The Events Calendar category slugs → app category.
const CAT_SLUGS: Record<string, string> = {
  wystawa: "Sztuka",
  wystawy: "Sztuka",
  jubileusz: "Sztuka",
  koncert: "Muzyka",
  koncerty: "Muzyka",
  warsztat: "Warsztaty",
  warsztaty: "Warsztaty",
  wyklad: "Konferencje",
  "oprowadzanie-spacer": "Sztuka",
  oprowadzanie: "Sztuka",
  spacer: "Sztuka",
  "lekcja-muzealna": "Warsztaty",
  spotkanie: "Konferencje",
  spotkania: "Konferencje",
  "spotkanie-cykliczne": "Konferencje",
  projekcja: "Kino",
  pokaz: "Kino",
  pokazy: "Kino",
  spektakl: "Teatr",
  teatr: "Teatr",
  kurs: "Warsztaty",
};

const CATEGORY_PRIORITY = ["Kino", "Teatr", "Muzyka", "Jedzenie", "Sport", "Warsztaty", "Konferencje", "Sztuka"];

function pickCategory(
  slugs: string[],
  title: string,
  description: string | undefined,
  venue: string,
): string {
  const mapped = [...new Set(slugs.map((s) => CAT_SLUGS[s]).filter(Boolean))];
  const guessed = classifyCategory(title, description, venue);
  if (guessed && mapped.includes(guessed)) return guessed;
  for (const category of CATEGORY_PRIORITY) if (mapped.includes(category)) return category;
  return guessed ?? "Inne";
}

interface LdEvent {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: string | string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: { streetAddress?: string; addressLocality?: string };
  };
}

function isEventNode(node: unknown): node is LdEvent {
  if (!node || typeof node !== "object") return false;
  const t = (node as { "@type"?: string | string[] })["@type"];
  return t === "Event" || (Array.isArray(t) && t.includes("Event"));
}

function collectEventNodes(parsed: unknown, out: LdEvent[]): void {
  if (Array.isArray(parsed)) {
    for (const item of parsed) collectEventNodes(item, out);
    return;
  }
  if (!parsed || typeof parsed !== "object") return;
  if (isEventNode(parsed)) out.push(parsed);
  const graph = (parsed as { "@graph"?: unknown })["@graph"];
  if (Array.isArray(graph)) for (const item of graph) collectEventNodes(item, out);
}

function isOutOfTown(name: string): boolean {
  const lower = name.toLowerCase();
  return OUT_OF_TOWN.some((o) => lower.includes(o));
}


function pickImage(image: string | string[] | undefined): string | undefined {
  if (!image) return undefined;
  const arr = Array.isArray(image) ? image : [image];
  return arr.find((u) => typeof u === "string" && u.startsWith("http"));
}

export class MnpScraper implements Scraper {
  name = "mnp";

  async scrape(): Promise<ScrapedEvent[]> {
    console.log("[MNP] Fetching...");
    const { data } = await axios.get(PAGE_URL, { headers: { "User-Agent": "POznaj/1.0" }, timeout: 20000 });
    const $ = cheerio.load(data);

    // 1. Category slugs from the calendar list markup (authoritative).
    const categoryByUrl = new Map<string, string[]>();
    $("li.tribe-events-calendar-list__event-row, .tribe-events-calendar-list__event-row").each((_, el) => {
      const $row = $(el);
      const href = $row.find(".tribe-events-calendar-list__event-title-link").attr("href")
        ?? $row.find("a[rel='bookmark']").attr("href");
      if (!href) return;
      const classes = `${$row.find("article").attr("class") ?? ""} ${$row.attr("class") ?? ""}`;
      const slugs = [...classes.matchAll(/tribe_events_cat-([a-z0-9-]+)/gi)].map((m) => m[1].toLowerCase());
      if (slugs.length > 0) categoryByUrl.set(href.replace(/\/$/, ""), slugs);
    });
    console.log(`[MNP] category map: ${categoryByUrl.size} rows`);

    // 2. Structured event data from schema.org JSON-LD (cleanest source).
    const ldEvents: LdEvent[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        collectEventNodes(JSON.parse($(el).html() || "null"), ldEvents);
      } catch { /* ignore malformed blocks */ }
    });
    console.log(`[MNP] JSON-LD events: ${ldEvents.length}`);

    const events: ScrapedEvent[] = [];
    const seen = new Set<string>();

    for (const ld of ldEvents) {
      const title = htmlToText(ld.name);
      if (!title || title.length < 4) continue;

      const startParsed = parseSourceDate(ld.startDate);
      const endParsed = parseSourceDate(ld.endDate) ?? startParsed;
      if (!startParsed || !endParsed) continue;
      const start = startParsed.date;
      const end = endParsed.date;
      if (end.getTime() < start.getTime()) continue;

      const venueRaw = htmlToText(ld.location?.name) || "Muzeum Narodowe w Poznaniu";
      const venue = cleanPlaceName(venueRaw) || "Muzeum Narodowe w Poznaniu";
      if (isOutOfTown(venueRaw) || isOutOfTown(venue)) continue;

      const address = ld.location?.address?.streetAddress
        ? htmlToText(ld.location.address.streetAddress)
        : undefined;

      const description = htmlToText(ld.description).replace(/\.{3,}$/, "").trim() || undefined;

      const sourceUrl = ld.url ?? PAGE_URL;
      const key = `${venue}|${start.toISOString().slice(0, 10)}|${title}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const slugs = categoryByUrl.get(sourceUrl.replace(/\/$/, "")) ?? [];
      const category = pickCategory(slugs, title, description, venue);

      const venueData = matchVenue(`${venue} ${title}`) ?? matchVenue(venue);
      let coordsX = venueData?.lat;
      let coordsY = venueData?.lon;
      let district = venueData?.district;

      if (!venueData) {
        const geo = await geocodeVenue(venue, title, address);
        if (geo) {
          coordsX = geo.lat;
          coordsY = geo.lon;
          district = geo.district;
        }
      }

      events.push({
        title,
        description,
        imageUrl: pickImage(ld.image),
        sourceUrl,
        startDate: start,
        endDate: end,
        time: startParsed.allDay ? undefined : timeInWarsaw(start),
        placeName: venue,
        address,
        district: district ?? "Centrum",
        category,
        vibes: guessVibesForCategory(category),
        source: SOURCE,
        // Stable per-event permalink → safe to prune legacy `title|place|date` ids.
        sourceId: `mnp/${new URL(sourceUrl).pathname.replace(/^\/|\/$/g, "")}`,
        coordsX,
        coordsY,
        outdoor: false,
      });
    }

    // 3. Coordinates fallback: district centre for anything still unlocated.
    for (const ev of events) {
      if (ev.coordsX != null && ev.coordsY != null) continue;
      const center = districtFallback(ev.district);
      ev.coordsX = center.lat;
      ev.coordsY = center.lon;
      ev.district = center.district;
    }

    console.log(`[MNP] ${events.length} events`);
    return events;
  }
}
