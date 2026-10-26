import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibesForCategory } from "@/lib/vibes";
import {
  classifyCategory,
  cleanDescription,
  cleanPlaceName,
  dateKeyInWarsaw,
  decodeEntities,
  htmlToText,
  normalizeSpace,
  normalizeTime,
  parseSourceDate,
  polishMonthIndex,
  timeInWarsaw,
  warsawDate,
} from "./text";

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };
const ENRICH_WORKERS = 5;

interface LdEvent {
  "@type"?: string | string[];
  name?: string;
  description?: string;
  image?: string | string[];
  startDate?: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: { streetAddress?: string; addressLocality?: string; postalCode?: string };
  };
  offers?: { price?: string | number } | { price?: string | number }[];
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

function pickImage(image: string | string[] | undefined): string | undefined {
  if (!image) return undefined;
  const arr = Array.isArray(image) ? image : [image];
  return arr.find((u) => typeof u === "string" && u.startsWith("http"));
}

function pickPrice(offers: LdEvent["offers"]): string | undefined {
  if (!offers) return undefined;
  const first = Array.isArray(offers) ? offers[0] : offers;
  if (!first || first.price == null) return undefined;
  const value = typeof first.price === "number" ? first.price : parseFloat(String(first.price).replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  if (value === 0) return "0 zł";
  return `${Math.round(value)} zł`;
}

/**
 * Parse the listing "data" span, e.g.
 *   "poniedziałek, 26 października 2026, 19:00"
 *   "11 grudnia 2026 - 13 grudnia 2026"
 */
export function parsePikDataSpan(raw: string): { start: Date; end: Date; time?: string } | null {
  const text = normalizeSpace(raw);
  if (!text) return null;
  const matches = [...text.matchAll(/(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})/gi)];
  if (matches.length === 0) return null;
  const first = matches[0];
  const last = matches[matches.length - 1];
  const m1 = polishMonthIndex(first[2]);
  const m2 = polishMonthIndex(last[2]);
  if (m1 == null || m2 == null) return null;

  const timeMatch = text.match(/(?:,\s*|o\s+|godz\.?\s*)(\d{1,2})[:.](\d{2})\s*$/i);
  const time = timeMatch ? `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}` : undefined;
  const [h, min] = time ? time.split(":").map(Number) : [12, 0];

  const start = warsawDate(Number(first[3]), m1, Number(first[1]), h, min);
  let end = matches.length > 1
    ? warsawDate(Number(last[3]), m2, Number(last[1]), h, min)
    : new Date(start);
  if (end.getTime() < start.getTime()) end = new Date(start);
  return { start, end, time };
}


// Parse recurring movie/screening sub-events: "DD.MM.YYYY, godz. HH:MM – Title"
function parseScreenings(description: string): { date: Date; time: string; title: string }[] {
  const screenings: { date: Date; time: string; title: string }[] = [];
  const pattern = /(\d{1,2})\.(\d{1,2})\.(\d{4}),\s*godz\.\s*(\d{1,2}):(\d{2})\s*[–-]\s*(.+)/g;
  let match;
  while ((match = pattern.exec(description)) !== null) {
    const [, dd, mm, yyyy, hh, min, title] = match;
    const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12));
    if (!Number.isFinite(d.getTime())) continue;
    screenings.push({ date: d, time: `${String(Number(hh)).padStart(2, "0")}:${min}`, title: title.trim() });
  }
  return screenings;
}

interface ListingItem {
  title: string;
  href: string;
  image?: string;
  dataSpan: string;
  excerpt?: string;
  sourceId: string;
  sourceUrl: string;
  section: string;
}

const SECTION_CATEGORY: Record<string, string> = {
  muzyka: "Muzyka",
  teatr: "Teatr",
  kino: "Kino",
  festiwal: "",
  dzieci: "",
};

export class PikPoznanScraper implements Scraper {
  name = "pikpoznan";

  private sources = [
    { url: "https://pik.poznan.pl/muzyka/", label: "Muzyka" },
    { url: "https://pik.poznan.pl/teatr/", label: "Teatr" },
    { url: "https://pik.poznan.pl/festiwal/", label: "Festiwal" },
    { url: "https://pik.poznan.pl/kino/", label: "Kino" },
    { url: "https://pik.poznan.pl/dzieci/", label: "Dzieci" },
  ];

  async scrape(): Promise<ScrapedEvent[]> {
    const listings: ListingItem[] = [];
    const seen = new Set<string>();

    for (const source of this.sources) {
      try {
        const items = await this.scrapeSection(source.url, source.label.toLowerCase());
        console.log(`[PikPoznan] ${source.label}: ${items.length} listings`);
        for (const item of items) {
          if (seen.has(item.sourceId)) continue;
          seen.add(item.sourceId);
          listings.push(item);
        }
      } catch (e) {
        console.error(`[PikPoznan] Error scraping ${source.url}:`, e);
      }
    }

    // Fetch each event article and enrich from its schema.org Event JSON-LD.
    // Plain articles (no Event node) are dropped — they used to become fake
    // events dated "today" with a grab-bag description.
    const events: ScrapedEvent[] = [];
    let cursor = 0;
    // Arrow function keeps the method's `this` — no alias needed.
    const workers = Array.from({ length: ENRICH_WORKERS }, async () => {
      while (cursor < listings.length) {
        const item = listings[cursor++];
        const ev = await this.enrichFromArticle(item);
        if (ev) events.push(ev);
      }
    });
    await Promise.all(workers);
    events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    console.log(`[PikPoznan] ${listings.length} listings → ${events.length} events with Event JSON-LD`);

    // Split recurring screening lists ("Kino letnie" pages listing many seances).
    const splitEvents: ScrapedEvent[] = [];
    for (const ev of events) {
      if (!ev.description) continue;
      const screenings = parseScreenings(ev.description);
      if (screenings.length < 3) continue;
      for (const s of screenings) {
        splitEvents.push({
          title: s.title,
          description: `${ev.title} — ${s.title}`,
          imageUrl: ev.imageUrl,
          sourceUrl: ev.sourceUrl,
          startDate: s.date,
          endDate: s.date,
          time: s.time,
          placeName: ev.placeName,
          address: ev.address,
          district: ev.district,
          category: "Kino",
          vibes: ["Kulturalne"],
          source: ev.source,
          sourceId: `pikpoznan-${Buffer.from(s.title + s.date.toISOString()).toString("base64").slice(0, 24)}`,
          coordsX: ev.coordsX,
          coordsY: ev.coordsY,
          price: ev.price,
        });
      }
    }
    events.push(...splitEvents);

    // Coordinates: venue match → Nominatim → district centre.
    for (const ev of events) {
      if (ev.coordsX != null && ev.coordsY != null) continue;
      const geo = await geocodeVenue(ev.placeName, ev.title, ev.address);
      if (geo) {
        ev.coordsX = geo.lat;
        ev.coordsY = geo.lon;
        ev.district = geo.district;
      }
    }
    for (const ev of events) {
      if (ev.coordsX != null && ev.coordsY != null) continue;
      const center = districtFallback(ev.district);
      ev.coordsX = center.lat;
      ev.coordsY = center.lon;
      ev.district = center.district;
    }

    // Drop past events before they reach saveEvents.
    const now = Date.now();
    return events.filter((ev) => ev.endDate.getTime() >= now - 86400000);
  }

  private async scrapeSection(url: string, section: string): Promise<ListingItem[]> {
    const res = await axios.get(url, { headers: UA, timeout: 15000 });
    const $ = cheerio.load(res.data);
    const items: ListingItem[] = [];

    $(".posts-grid .blog-post, .blog-post").each((_, el) => {
      const $el = $(el);
      const titleAnchor = $el.find(".bp-head h2 a, h2 a").first();
      const title = titleAnchor.text().replace(/\s+/g, " ").trim();
      const href = titleAnchor.attr("href") ?? "";
      const dataSpan = $el.find("span.data").first().text().replace(/\s+/g, " ").trim();
      if (!title || !href || !dataSpan) return; // not an event tile

      // Stable source id from the listing title, matching the previous format so
      // the daily refresh updates existing rows instead of duplicating them.
      const legacyTitle = decodeEntities(title)
        .replace(/\s*[–\u2013\u2014\-—]\s*[Bb]ilety\s*$/g, "")
        .replace(/\s*\|\s*[Bb]ilety\s*$/g, "")
        .replace(/&#8211;\s*Bilety/gi, "")
        .trim();
      const image = $el.find(".post-img img, img").first().attr("src") ?? undefined;
      let excerpt = "";
      $el.find(".bp-details p").each((_, p) => {
        const text = $(p).text().replace(/\s+/g, " ").replace(/Czytaj więcej.*$/i, "").trim();
        if (text.length > excerpt.length) excerpt = text;
      });
      items.push({
        title,
        href,
        image,
        dataSpan,
        excerpt: excerpt || undefined,
        sourceId: `pikpoznan-${Buffer.from(legacyTitle).toString("base64").slice(0, 24)}`,
        sourceUrl: url,
        section,
      });
    });

    return items;
  }

  private async enrichFromArticle(item: ListingItem): Promise<ScrapedEvent | null> {
    const dateFallback = parsePikDataSpan(item.dataSpan);

    try {
      const article = await axios.get(item.href, { headers: UA, timeout: 15000 });
      const $$ = cheerio.load(article.data);

      const ldEvents: LdEvent[] = [];
      $$('script[type="application/ld+json"]').each((_, el) => {
        try {
          collectEventNodes(JSON.parse($$(el).html() || "null"), ldEvents);
        } catch { /* ignore malformed JSON-LD */ }
      });
      const ld = ldEvents.find((e) => e.startDate) ?? ldEvents[0];
      if (!ld || !ld.startDate) return null; // plain article/review, not an event

      const startParsed = parseSourceDate(ld.startDate);
      if (!startParsed) return null;
      const start = startParsed.date;
      const endParsed = parseSourceDate(ld.endDate);
      let end = endParsed ? endParsed.date : new Date(start);
      if (end.getTime() <= start.getTime()) {
        end = new Date(start.getTime() + 2 * 3600 * 1000); // source sends midnight when no end
      }
      // The listing date span is more trustworthy for multi-day ranges; JSON-LD
      // sometimes collapses a range to a single day.
      if (dateFallback && dateKeyInWarsaw(dateFallback.end) > dateKeyInWarsaw(dateFallback.start)) {
        if (dateFallback.end.getTime() > end.getTime() || dateKeyInWarsaw(start) === dateKeyInWarsaw(end)) {
          end = new Date(dateFallback.end);
        }
      }

      // Long description from the article body; metadata blocks are stripped by
      // base.cleanDescription. JSON-LD excerpt only covers the first sentence.
      const contentEl = $$(".entry-content, .post-content, article").first();
      contentEl.find("script, style, noscript, iframe, .buttony, .sharedaddy").remove();
      const contentText = contentEl.text().trim();
      const description =
        (contentText.length > 100 ? contentText.slice(0, 2000) : "") ||
        ld.description ||
        item.excerpt ||
        undefined;

      const locationName = htmlToText(ld.location?.name) || "Poznań";
      const placeName = cleanPlaceName(locationName) || "Poznań";
      const venueData = matchVenue(placeName);

      const title = htmlToText(ld.name) || item.title;
      const shortDesc = cleanDescription(ld.description) ?? "";
      const category = classifyCategory(title, shortDesc) ?? SECTION_CATEGORY[item.section] ?? "Inne";

      const time = startParsed.allDay
        ? normalizeTime(dateFallback?.time)
        : timeInWarsaw(start);

      return {
        title,
        description,
        imageUrl: pickImage(ld.image) ?? item.image,
        sourceUrl: item.href,
        startDate: start,
        endDate: end,
        time,
        placeName,
        address: ld.location?.address?.streetAddress ? htmlToText(ld.location.address.streetAddress) : undefined,
        district: venueData?.district ?? "Centrum",
        category,
        vibes: guessVibesForCategory(category),
        source: "pikpoznan",
        sourceId: item.sourceId,
        coordsX: venueData?.lat,
        coordsY: venueData?.lon,
        price: pickPrice(ld.offers),
      };
    } catch {
      // Transient article failure: keep listing-level data rather than a hole.
      if (!dateFallback) return null;
      const category = classifyCategory(item.title, item.excerpt) ?? SECTION_CATEGORY[item.section] ?? "Inne";
      const venueData = matchVenue(`${item.title} ${item.excerpt ?? ""}`);
      return {
        title: item.title,
        description: item.excerpt,
        imageUrl: item.image,
        sourceUrl: item.href,
        startDate: dateFallback.start,
        endDate: dateFallback.end,
        time: dateFallback.time,
        placeName: "Poznań",
        district: venueData?.district ?? "Centrum",
        category,
        vibes: guessVibesForCategory(category),
        source: "pikpoznan",
        sourceId: item.sourceId,
        coordsX: venueData?.lat,
        coordsY: venueData?.lon,
      };
    }
  }
}
