import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";

function guessCategory(title: string, desc: string): string {
  const c = (title + " " + desc).toLowerCase();
  // "koncert w Teatrze" = Music, not Theater
  if (c.includes("koncer") && c.includes("teatr")) return "Muzyka";
  if (c.includes("kino") || c.includes("film") || c.includes("seans")) return "Kino";
  if (c.includes("sztuk") || c.includes("wystaw") || c.includes("wernis") || c.includes("galeri")) return "Sztuka";
  if (c.includes("muzy") || c.includes("koncer") || c.includes("festiwal") || c.includes("wokal") || c.includes("recital") || c.includes("orkiestr") || c.includes("opery") || c.includes("rock") || c.includes("jazz") || c.includes("chór")) return "Muzyka";
  if (c.includes("teatr") || c.includes("spektakl") || c.includes("musical") || c.includes("komedi") || c.includes("balet")) return "Teatr";
  if (c.includes("sport") || c.includes("bieg") || c.includes("zawod") || c.includes("turniej") || c.includes("mecz")) return "Sport";
  if (c.includes("warsztat") || c.includes("kurs") || c.includes("szkole")) return "Warsztaty";
  if (c.includes("konferenc") || c.includes("wykład") || c.includes("prelekcj")) return "Konferencje";
  if (c.includes("jedzeni") || c.includes("kulinar") || c.includes("degustac") || c.includes("jarmark") || c.includes("targ")) return "Jedzenie";
  return "Inne";
}

const MONTHS = [
  ["styczen", 77],  ["luty", 78], ["marzec", 79], ["kwiecien", 80],
  ["maj", 81], ["czerwiec", 82], ["lipiec", 83], ["sierpien", 84],
  ["wrzesien", 85], ["pazdziernik", 86], ["listopad", 87], ["grudzien", 88],
];

function parsePolishDate(dateStr: string, year: number): Date {
  // "DD.MM" or "DD.MM.YYYY" — single date
  const single = dateStr.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (single) {
    const day = parseInt(single[1]);
    const month = parseInt(single[2]) - 1;
    const y = single[3] ? parseInt(single[3]) : year;
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      return new Date(y, month, day);
    }
  }
  // "1-3.05." or "8-15.05" — date range
  const range = dateStr.match(/(\d{1,2})[.-](\d{1,2})\s*\.?\s*(\d{1,2})/);
  if (range) {
    const month = parseInt(range[3]) - 1;
    const end = parseInt(range[2]);
    if (month >= 0 && month <= 11) return new Date(year, month, end);
  }
  return new Date(year, 0, 1);
}

function parseDateRange(dateStr: string, year: number): { start: Date; end: Date } {
  const cleaned = dateStr.replace(/godzina?\s*\d{1,2}[.:]\d{2}/gi, "").trim();
  const parts = cleaned.split(/\s*-\s*/);
  if (parts.length >= 2) {
    return { start: parsePolishDate(parts[0], year), end: parsePolishDate(parts[1], year) };
  }
  const d = parsePolishDate(cleaned, year);
  return { start: d, end: d };
}

function guessDistrict(title: string, text: string): string {
  const lower = (title + " " + text).toLowerCase();
  if (lower.includes("stary rynek") || lower.includes("centrum") || lower.includes("śródmieście")) return "Centrum";
  if (lower.includes("jeżyce") || lower.includes("jezyce")) return "Jezyce";
  if (lower.includes("grunwald") || lower.includes("łazarz") || lower.includes("lazarz")) return "Grunwald";
  if (lower.includes("wilda")) return "Wilda";
  if (lower.includes("rataje") || lower.includes("malta") || lower.includes("nowe miasto") || lower.includes("śródka") || lower.includes("ostrów tumski")) return "NoweMiasto";
  if (lower.includes("piątkowo") || lower.includes("piatkowo") || lower.includes("winogrady") || lower.includes("cytadela") || lower.includes("rusałka")) return "StareMiasto";
  return "Inny";
}

function isSubEventLine(line: string): boolean {
  // "- 7.05 - Aula Artis - Title" or "- 12.05 - Pod Minogą - Title"
  return /^[\s-]*\d{1,2}\.\d{2}\s*[-–]\s*.+[-–]\s*.+/.test(line);
}

function parseSubEvents(html: string, year: number): { date: Date; venue: string; title: string }[] {
  const lines = html.split(/<br\s*\/?>/i);
  const sub: { date: Date; venue: string; title: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^[\s-]*(\d{1,2}\.\d{2})\s*[-–]\s*(.+?)\s*[-–]\s*(.+)/);
    if (match) {
      const date = parsePolishDate(match[1], year);
      if (isNaN(date.getTime())) continue;
      const venue = match[2].trim();
      const title = match[3].trim();
      if (venue && title) sub.push({ date, venue, title });
    }
  }
  return sub;
}

// Parse recurring movie/screening sub-events: "DD.MM.YYYY, godz. HH:MM – Title"
function parseScreenings(description: string, year: number): { date: Date; time: string; title: string }[] {
  const screenings: { date: Date; time: string; title: string }[] = [];
  const pattern = /(\d{1,2}\.\d{2}\.\d{4}),\s*godz\.\s*(\d{1,2}:\d{2})\s*[–\-]\s*(.+)/g;
  let match;
  while ((match = pattern.exec(description)) !== null) {
    const [_, dateStr, time, title] = match;
    const parts = dateStr.split(".");
    const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12);
    if (!isNaN(d.getTime())) {
      screenings.push({ date: d, time, title: title.trim() });
    }
  }
  return screenings;
}

export class KulturaPoznanScraper implements Scraper {
  name = "kultura-poznan";

  async scrape(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const year = 2026;

    for (const [month, id] of MONTHS) {
      const url = `https://kultura.poznan.pl/mim/kultura/${month},p,89975,899${id}.html`;
      console.log(`[KulturaPoznan] Fetching ${month}...`);

      try {
        const res = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          timeout: 15000,
        });

        const $ = cheerio.load(res.data);
        const dcBlocks = $(".dc-content");
        console.log(`[KulturaPoznan] ${month}: ${dcBlocks.length} event blocks`);

        dcBlocks.each((_, el) => {
          const $el = $(el);
          const title = $el.find("li strong").first().text().trim().replace(/&nbsp;/g, "").trim();
          if (!title || title.length < 3) return;

          const pEl = $el.find("p").first();
          const pHtml = pEl.html() || "";
          const pText = pEl.text().trim();

          // Extract fields from <p> content (handle concatenated fields without newlines)
          const dataMatch = pText.match(/Data:\s*(.+?)(?:\n|Miejsce|Lokalizacja|Więcej|Organizator|Bilety|\$)/im);
          const dateStr = dataMatch ? dataMatch[1].trim() : "";
          const { start, end } = dateStr ? parseDateRange(dateStr, year) : { start: new Date(year, 0, 1), end: new Date(year, 0, 1) };

          const venueMatch = pText.match(/(?:Miejsce|Lokalizacja):\s*(.+?)(?:\n|Więcej|Organizator|Bilety|\$)/im);
          let placeName = venueMatch ? venueMatch[1].trim() : "Poznań";

          const ticketMatch = pText.match(/Bilety:\s*(.+?)(?:\n|Więcej|Organizator|\$)/im);
          let price: string | undefined;
          if (ticketMatch) {
            const raw = ticketMatch[1].trim();
            const p = raw.match(/(?:(?:od|od)\s*[\-\u2013]?\s*)?(\d+(?:\s*[\.\,]\s*\d{2})?)\s*(?:zł|PLN)/i);
            if (p) price = `${p[1].replace(/\s/g, "")} zł`;
            else if (raw.match(/(?:wstęp|udział)\s+(?:wolny|bezpłatn)/i)) price = "0 zł";
          }

          // Description: text before first <br>
          let description = "";
          const brIdx = pText.indexOf("\n");
          if (brIdx > 0) {
            description = pText.substring(0, brIdx).trim();
          } else {
            description = pText.split(/(?:Data:|Miejsce:|Więcej:|Wiecej:|Organizator:)/)[0].trim();
          }

          const urlMatch = pHtml.match(/href="([^"]+)"/);
          const sourceUrl = urlMatch ? urlMatch[1] : url;

          // Fallback: extract price from description if Bilety field wasn't found
          if (!price) {
            const combined = description + " " + pText;
            const pMatch = combined.match(/(?:bilety?\s*(?:od\s*[\-\u2013]?\s*)?|cena\s*(?:od\s*[\-\u2013]?\s*)?)\s*(\d+(?:\s*[\.\,]\s*\d{2})?)\s*(?:zł|PLN)/i);
            if (pMatch) price = `${pMatch[1].replace(/\s/g, "")} zł`;
            else if (combined.match(/(?:wstęp|udział)\s+(?:wolny|bezpłatn)/i)) price = "0 zł";
          }

          const category = guessCategory(title, description);

          // Venue match for coordinates
          const venue = matchVenue(placeName);
          const address = venue?.address;
          const district = venue?.district ?? guessDistrict(title, placeName);
          const coordsX = venue?.lat;
          const coordsY = venue?.lon;

          // Handle recurring screenings (e.g. "Kino plenerowe" with multiple dates)
          const screenings = parseScreenings(pText, year);
          if (screenings.length >= 3) {
            for (const s of screenings) {
              const sDaysUntil = (s.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              if (sDaysUntil < -1) continue;
              events.push({
                title: s.title,
                description: `${title} — ${s.title}`,
                placeName,
                address,
                district: district !== "Inny" ? district : "Centrum",
                category: "Kino",
                sourceUrl,
                startDate: s.date,
                endDate: s.date,
                time: s.time,
                vibes: ["Kulturalne"],
                source: "kultura-poznan",
                sourceId: `kp-${Buffer.from(s.title + s.date.toISOString()).toString("base64").slice(0, 24)}`,
                coordsX,
                coordsY,
                price,
              });
            }
            return; // skip parent if screenings extracted
          }

          // Handle sub-events (e.g. "Inne koncerty")
          const subEvents = parseSubEvents(pHtml, year);

          if (subEvents.length > 0 && !venueMatch) {
            for (const sub of subEvents) {
              const subDaysUntil = (sub.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              if (subDaysUntil < -1) continue;
              const subVenue = matchVenue(sub.venue);
              events.push({
                title: sub.title,
                placeName: sub.venue,
                address: subVenue?.address,
                district: subVenue?.district ?? guessDistrict(sub.venue, ""),
                category: guessCategory(sub.title, description),
                description: `${title} — ${sub.venue}`,
                sourceUrl,
                startDate: sub.date,
                endDate: sub.date,
                time: undefined,
                vibes: ["Kulturalne"],
                source: "kultura-poznan",
                sourceId: `kp-${Buffer.from(sub.title + sub.date.toISOString()).toString("base64").slice(0, 24)}`,
                coordsX: subVenue?.lat,
                coordsY: subVenue?.lon,
                price,
              });
            }
            return; // skip parent event if sub-events exist
          }

          const now = new Date();
          const daysUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (daysUntil < -1) return;

          events.push({
            title,
            description: description || undefined,
            placeName,
            address,
            district: district !== "Inny" ? district : "Centrum",
            category,
            sourceUrl,
            startDate: start,
            endDate: end,
            time: undefined,
            vibes: ["Kulturalne"],
            source: "kultura-poznan",
            sourceId: `kp-${Buffer.from(title).toString("base64").slice(0, 24)}`,
            coordsX,
            coordsY,
            price,
          });
        });
      } catch (e) {
        console.error(`[KulturaPoznan] ${month} failed:`, (e as Error).message);
      }
    }

    // Post-loop: geocode any event without coordinates from venue match
    for (const ev of events) {
      if (ev.coordsX) continue;
      const geo = await geocodeVenue(ev.placeName, ev.title, ev.address);
      if (geo) {
        ev.coordsX = geo.lat;
        ev.coordsY = geo.lon;
        ev.district = geo.district;
      }
    }

    // Final fallback: events still without coords get district center
    for (const ev of events) {
      if (ev.coordsX) continue;
      const d = ev.district !== "Inny" ? ev.district : guessDistrict(ev.placeName, "");
      const center = districtFallback(d);
      ev.coordsX = center.lat;
      ev.coordsY = center.lon;
    }

    return events;
  }
}
