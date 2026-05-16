import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";

function guessCategory(title: string, desc: string): string {
  const c = (title + " " + desc).toLowerCase();
  if (c.includes("kino") || c.includes("film")) return "Kino";
  if (c.includes("sztuk") || c.includes("wystaw") || c.includes("wernis") || c.includes("galeri")) return "Sztuka";
  if (c.includes("teatr") || c.includes("spektakl") || c.includes("musical") || c.includes("komedi")) return "Teatr";
  if (c.includes("muzy") || c.includes("koncer") || c.includes("festiwal")) return "Muzyka";
  if (c.includes("sport") || c.includes("bieg") || c.includes("zawod")) return "Sport";
  if (c.includes("warsztat") || c.includes("kurs")) return "Warsztaty";
  if (c.includes("konferenc") || c.includes("wykład")) return "Konferencje";
  if (c.includes("jedzeni") || c.includes("kulinar") || c.includes("degustac")) return "Jedzenie";
  return "Inne";
}

const MONTHS = [
  ["styczen", 77],  ["luty", 78], ["marzec", 79], ["kwiecien", 80],
  ["maj", 81], ["czerwiec", 82], ["lipiec", 83], ["sierpien", 84],
  ["wrzesien", 85], ["pazdziernik", 86], ["listopad", 87], ["grudzien", 88],
];

function parsePolishDate(dateStr: string, year: number): Date {
  // "1-3.05.", "16.05", "8-15.05", "8.05"
  const match = dateStr.match(/(\d{1,2})(?:[.-](\d{1,2}))?\s*\.?\s*(\d{1,2})/);
  if (!match) return new Date(year, 0, 1);
  const end = match[2] ? parseInt(match[2]) : parseInt(match[1]);
  const month = parseInt(match[3]) - 1;
  return new Date(year, month, end);
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
      const venue = match[2].trim();
      const title = match[3].trim();
      if (venue && title) sub.push({ date, venue, title });
    }
  }
  return sub;
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

          // Extract fields from <p> content
          const dataMatch = pText.match(/Data:\s*(.+?)(?:\n|$)/m);
          const dateStr = dataMatch ? dataMatch[1].trim() : "";
          const { start, end } = dateStr ? parseDateRange(dateStr, year) : { start: new Date(year, 0, 1), end: new Date(year, 0, 1) };

          const venueMatch = pText.match(/(?:Miejsce|Lokalizacja):\s*(.+?)(?:\n|$)/m);
          let placeName = venueMatch ? venueMatch[1].trim() : "Poznań";

          const ticketMatch = pText.match(/Bilety:\s*(.+?)(?:\n|$)/m);
          let price = ticketMatch ? ticketMatch[1].trim() : undefined;

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
            const pMatch = (description + " " + pText).match(/(?:bilet[ya]\s*(?:od\s*)?|wstęp\s*(?:od\s*)?|cena\s*(?:od\s*)?)[\d\s]+\s*(?:zł|PLN)/i);
            if (pMatch) price = pMatch[0].trim();
            else if ((description + " " + pText).match(/(?:wstęp|udział)\s+(?:wolny|bezpłatn)/i)) price = "0 zł";
          }

          const category = guessCategory(title, description);

          // Venue match for coordinates
          const venue = matchVenue(placeName);
          const address = venue?.address;
          const district = venue?.district ?? guessDistrict(title, placeName);
          const coordsX = venue?.lat;
          const coordsY = venue?.lon;

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
                category: guessCategory(sub.title, ""),
                description: `${title} — ${sub.venue}`,
                sourceUrl,
                startDate: sub.date,
                endDate: sub.date,
                time: undefined,
                vibes: ["Kulturalne"],
                source: "kultura-poznan",
                sourceId: `kp-${Buffer.from(sub.title).toString("base64").slice(0, 24)}`,
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
