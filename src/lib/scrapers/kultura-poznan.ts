import { Scraper, ScrapedEvent } from "./base";
import axios from "axios";
import * as cheerio from "cheerio";
import { matchVenue } from "@/lib/venues";
import { geocodeVenue, districtFallback } from "./geocode";
import { guessVibes, guessVibesForCategory } from "@/lib/vibes";
import {
  classifyCategory,
  cleanPlaceName,
  cleanTitle,
  dateKeyInWarsaw,
  decodeEntities,
  extractAddressFromVenue,
  htmlToText,
  normalizeSpace,
  polishMonthIndex,
  warsawDate,
} from "./text";

const MONTHS = [
  ["styczen", 77], ["luty", 78], ["marzec", 79], ["kwiecien", 80],
  ["maj", 81], ["czerwiec", 82], ["lipiec", 83], ["sierpien", 84],
  ["wrzesien", 85], ["pazdziernik", 86], ["listopad", 87], ["grudzien", 88],
];

const FIELD_RE = /^(Data|Miejsce|Lokalizacja|Organizator|Organizatorzy|Bilety|Więcej|Wiecej|Cena|Ceny|Kontakt)\s*:/i;

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function normalizeYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const y = Number(raw);
  if (!Number.isFinite(y)) return undefined;
  if (y < 100) return y + 2000;
  return y;
}

/** Pick the year for a day/month on a page dedicated to (pageYear, pageMonth). */
/**
 * Pick the year for a day/month on a page dedicated to (pageYear, pageMonth).
 * Month pages list "their" month plus long-running items: early-year months on a
 * late-year page are events from the same (past) season, not next year, so only
 * explicit year-crossing ranges are shifted forward (see parseKulturaDateRange).
 */
function inferYear(monthIndex: number, pageMonth: number, pageYear: number): number {
  const delta = monthIndex - pageMonth;
  if (delta > 6) return pageYear - 1;
  return pageYear;
}

interface DateRange {
  start: Date;
  end: Date;
  time?: string;
}

function parseTimeFromData(raw: string): string | undefined {
  const m = raw.match(/(?:godz(?:ina)?|g)\.?\s*(\d{1,2})\s*[.:]\s*(\d{2})/i);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function dateRangeFromMonths(startMonth: number, endMonth: number, pageMonth: number, pageYear: number): DateRange {
  const startYear = inferYear(startMonth, pageMonth, pageYear);
  let endYear = inferYear(endMonth, pageMonth, pageYear);
  if (endYear < startYear) endYear = startYear;
  const start = warsawDate(startYear, startMonth, 1, 12);
  const end = warsawDate(endYear, endMonth, lastDayOfMonth(endYear, endMonth), 12);
  return { start, end };
}

/**
 * Parse the many date formats used by kultura.poznan.pl, e.g.
 *   "25.01", "11.11", "24-26.02", "1-3.05.", "25.11-1.12", "22.11.2025 - 21.06.2026",
 *   "2, 3, 4, 6, 9, 10 i 11.01.2026", "do 6.01", "czerwiec-lipiec", "14.05 (termin wstępny) do października 2026".
 */
export function parseKulturaDateRange(raw: string, pageMonth: number, pageYear: number): DateRange | null {
  const original = normalizeSpace(raw);
  if (!original) return null;

  const time = parseTimeFromData(original);

  const s = original
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:godz(?:ina)?|g)\.?\s*\d{1,2}\s*[.:]\s*\d{2}/gi, " ")
    .replace(/\b(?:termin\s+wstępny|termin\s+wstepny|gala\s+finałowa|gala\s+finalowa|premiera|otwarcie|pokaz)\b/gi, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return null;

  const withTime = (r: DateRange): DateRange => {
    if (!time) return r;
    const [h, m] = time.split(":").map(Number);
    const d = dateKeyInWarsaw(r.start).split("-").map(Number);
    const start = warsawDate(d[0], d[1] - 1, d[2], h, m);
    const sameDay = dateKeyInWarsaw(r.end) === dateKeyInWarsaw(r.start);
    const end = sameDay ? new Date(start) : r.end;
    return { start, end };
  };

  // 1. Full numeric range, e.g. "22.11.2025 - 21.06.2026", "25.11-1.12", "10.07.2026-28.02.2027"
  const full = s.match(
    /(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?\s*[-–—]\s*(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/
  );
  if (full) {
    const d1 = Number(full[1]);
    const m1 = Number(full[2]) - 1;
    const y1 = normalizeYear(full[3]) ?? inferYear(m1, pageMonth, pageYear);
    const d2 = Number(full[4]);
    const m2 = Number(full[5]) - 1;
    let y2 = normalizeYear(full[6]);
    if (y2 == null) {
      // Month wrap without an explicit end year ("30.12-2.01") rolls to next year.
      y2 = m2 < m1 ? y1 + 1 : inferYear(m2, pageMonth, pageYear);
      if (y2 < y1) y2 = y1;
    }
    if (m1 >= 0 && m1 <= 11 && m2 >= 0 && m2 <= 11 && d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
      const start = warsawDate(y1, m1, d1, 12);
      let end = warsawDate(y2, m2, d2, 12);
      if (end.getTime() < start.getTime()) end = start;
      return withTime({ start, end });
    }
  }

  // 1b. Two numeric dates joined by "do", e.g. "gala finałowa - 27.08, wystawa do 20.09"
  const doRange = s.match(/(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?[^0-9]{0,14}?do\s+(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/i);
  if (doRange) {
    const d1 = Number(doRange[1]);
    const m1 = Number(doRange[2]) - 1;
    const y1 = normalizeYear(doRange[3]) ?? inferYear(m1, pageMonth, pageYear);
    const d2 = Number(doRange[4]);
    const m2 = Number(doRange[5]) - 1;
    let y2 = normalizeYear(doRange[6]) ?? inferYear(m2, pageMonth, pageYear);
    if (y2 < y1) y2 = m2 < m1 ? y1 + 1 : y1;
    if (m1 >= 0 && m1 <= 11 && m2 >= 0 && m2 <= 11 && d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
      const start = warsawDate(y1, m1, d1, 12);
      let end = warsawDate(y2, m2, d2, 12);
      if (end.getTime() < start.getTime()) end = start;
      return withTime({ start, end });
    }
  }

  // 2. A comma/"i" list of days, e.g. "2, 3, 4, 6, 9, 10 i 11.01.2026"
  const list = s.match(/^(\d{1,2})(?:\s*,\s*\d{1,2})+[^]*?(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/)
    ?? s.match(/^(\d{1,2})\s+i\s+(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/);
  if (list) {
    const firstDay = Number(list[1]);
    const lastDay = Number(list[2]);
    const month = Number(list[3]) - 1;
    const year = normalizeYear(list[4]) ?? inferYear(month, pageMonth, pageYear);
    if (month >= 0 && month <= 11 && firstDay >= 1 && firstDay <= 31) {
      return withTime({
        start: warsawDate(year, month, firstDay, 12),
        end: warsawDate(year, month, Math.max(firstDay, lastDay), 12),
      });
    }
  }

  // 3. Day range within one month: "24-26.02", "1-3.05.", "6-11.11"
  const dayRange = s.match(/^[^0-9]*(\d{1,2})\s*[-–—]\s*(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/);
  if (dayRange) {
    const d1 = Number(dayRange[1]);
    const d2 = Number(dayRange[2]);
    const month = Number(dayRange[3]) - 1;
    const year = normalizeYear(dayRange[4]) ?? inferYear(month, pageMonth, pageYear);
    if (month >= 0 && month <= 11 && d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
      return withTime({
        start: warsawDate(year, month, d1, 12),
        end: warsawDate(year, month, Math.max(d1, d2), 12),
      });
    }
  }

  // 4. "<date> do <month name> [year]", e.g. "14.05 (termin wstępny) do października 2026"
  const toMonthWord = s.match(/(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?\s*[-–—]?\s*do\s+([a-ząćęłńóśźż]{3,})(?:\s+(\d{4}))?/i);
  if (toMonthWord) {
    const endMonth = polishMonthIndex(toMonthWord[4]);
    if (endMonth != null) {
      const d1 = Number(toMonthWord[1]);
      const m1 = Number(toMonthWord[2]) - 1;
      const y1 = normalizeYear(toMonthWord[3]) ?? inferYear(m1, pageMonth, pageYear);
      let endYear = normalizeYear(toMonthWord[5]) ?? inferYear(endMonth, pageMonth, pageYear);
      if (endYear < y1) endYear = y1;
      if (m1 >= 0 && m1 <= 11) {
        return withTime({
          start: warsawDate(y1, m1, d1, 12),
          end: warsawDate(endYear, endMonth, lastDayOfMonth(endYear, endMonth), 12),
        });
      }
    }
  }

  // 5. "do 6.01" (ongoing until date) — start approximated as the page month's first day.
  const untilDate = s.match(/do\s+(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/i);
  if (untilDate) {
    const d2 = Number(untilDate[1]);
    const m2 = Number(untilDate[2]) - 1;
    const y2 = normalizeYear(untilDate[3]) ?? inferYear(m2, pageMonth, pageYear);
    if (m2 >= 0 && m2 <= 11) {
      const end = warsawDate(y2, m2, d2, 12);
      let start = warsawDate(pageYear, pageMonth, 1, 12);
      if (end.getTime() < start.getTime()) start = warsawDate(y2, m2, 1, 12);
      return withTime({ start, end });
    }
  }

  // 6. Month-name range, e.g. "czerwiec-lipiec", "lipiec-sierpień"
  const monthWords = [...s.matchAll(/([a-ząćęłńóśźż]{3,})/gi)].map((m) => polishMonthIndex(m[1]));
  const monthNameRange = s.match(/([a-ząćęłńóśźż]{3,})\s*[-–—]\s*([a-ząćęłńóśźż]{3,})/i);
  if (monthNameRange) {
    const m1 = polishMonthIndex(monthNameRange[1]);
    const m2 = polishMonthIndex(monthNameRange[2]);
    if (m1 != null && m2 != null) return withTime(dateRangeFromMonths(m1, m2, pageMonth, pageYear));
  }

  // 7. Single month name, e.g. "kwiecień"
  const singleMonth = monthWords.find((m) => m != null);
  if (singleMonth != null) return withTime(dateRangeFromMonths(singleMonth, singleMonth, pageMonth, pageYear));

  // 8. Single numeric date, e.g. "8.08", "11.11", "25.01.2027"
  const single = s.match(/(\d{1,2})[.](\d{1,2})(?:[.](\d{2,4}))?/);
  if (single) {
    const day = Number(single[1]);
    const month = Number(single[2]) - 1;
    const year = normalizeYear(single[3]) ?? inferYear(month, pageMonth, pageYear);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = warsawDate(year, month, day, 12);
      return withTime({ start: d, end: new Date(d) });
    }
  }

  return null;
}

interface SubEvent {
  start: Date;
  end: Date;
  title: string;
  venue?: string;
}

/**
 * Parse section listings:
 *   "- 2.11 - Aula UAM - Aga Zaryan"  (venue between the two separators)
 *   "6.11 - Sąsiedzi. V Paderewski Festiwal 2026"  (title only, venue from Miejsce:)
 * The caller decides whether the mid-separator is a venue based on the section.
 */
function parseSubEvents(
  segments: string[],
  pageMonth: number,
  pageYear: number,
  splitVenue: boolean,
): SubEvent[] {
  const out: SubEvent[] = [];
  for (const segment of segments) {
    const line = segment.replace(/^[\s\-•*]+/, "").trim();
    if (!line) continue;
    const m = line.match(/^(\d{1,2})(?:\s*[i]\s*(\d{1,2}))?[.](\d{1,2})\.?\s*[-–—]\s*(.+)$/);
    if (!m) continue;
    const d1 = Number(m[1]);
    const d2 = m[2] ? Number(m[2]) : d1;
    const month = Number(m[3]) - 1;
    if (month < 0 || month > 11 || d1 < 1 || d1 > 31) continue;
    const rest = m[4].trim();
    if (!rest) continue;
    // Venue is the first segment only when the remainder uses spaced separators
    // (so "Centrum Kongresowo-Dydaktyczne UM - Czerwone Gitary" keeps its hyphen).
    const parts = rest.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
    let venue: string | undefined;
    let title: string;
    if (splitVenue && parts.length >= 2) {
      venue = parts[0];
      title = parts.slice(1).join(" - ");
    } else {
      title = parts.join(" - ");
    }
    title = cleanTitle(title);
    if (!title || title.length < 3) continue;
    const start = warsawDate(inferYear(month, pageMonth, pageYear), month, d1, 12);
    const end = warsawDate(inferYear(month, pageMonth, pageYear), month, Math.max(d1, d2), 12);
    out.push({ start, end, title, venue: venue ? cleanPlaceName(venue) : undefined });
  }
  return out;
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

export class KulturaPoznanScraper implements Scraper {
  name = "kultura-poznan";

  async scrape(): Promise<ScrapedEvent[]> {
    const events: ScrapedEvent[] = [];
    const seen = new Set<string>();
    const now = new Date();
    const pageYear = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", year: "numeric" }).format(now));

    for (let pageMonth = 0; pageMonth < MONTHS.length; pageMonth++) {
      const [monthName, id] = MONTHS[pageMonth];
      const url = `https://kultura.poznan.pl/mim/kultura/${monthName},p,89975,899${id}.html`;
      console.log(`[KulturaPoznan] Fetching ${monthName}...`);

      try {
        const res = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "text/html,application/xhtml+xml",
          },
          timeout: 15000,
        });

        const $ = cheerio.load(res.data);
        const blocks = $(".dc-content");
        console.log(`[KulturaPoznan] ${monthName}: ${blocks.length} event blocks`);

        blocks.each((_, el) => {
          const $el = $(el);
          const rawTitle = $el.find("li strong").first().text().replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
          if (!rawTitle || rawTitle.length < 3) return;

          const pEl = $el.find("p").first();
          const pHtml = pEl.html() ?? "";
          const segments = pHtml
            .split(/<br\s*\/?>/i)
            .map((segment) => htmlToText(segment))
            .map((segment) => normalizeSpace(segment))
            .filter(Boolean);
          const fullText = segments.join(" ");

          const firstFieldIdx = segments.findIndex((segment) => FIELD_RE.test(segment));
          const preField = firstFieldIdx >= 0 ? segments.slice(0, firstFieldIdx) : segments;
          const description = preField.join(" ").replace(/\s+/g, " ").trim();

          const fieldText = (label: RegExp): string => {
            for (const segment of segments) {
              if (label.test(segment)) {
                return segment.replace(label, "").replace(FIELD_RE, "").trim();
              }
            }
            const m = fullText.match(new RegExp(label.source + "\\s*(.*?)(?=\\s*(?:Data|Miejsce|Lokalizacja|Organizator|Organizatorzy|Bilety|Więcej|Wiecej|Cena|Ceny|Kontakt)\\s*:|$)", "i"));
            return m ? m[1].trim() : "";
          };

          const dataStr = fieldText(/^\s*Data\s*:/i);
          const venueStr = fieldText(/^\s*(?:Miejsce|Lokalizacja)\s*:/i);
          const detailsStr = (() => {
            for (const segment of segments) {
              if (/^\s*Bilety\s*:/i.test(segment)) return segment.replace(/^\s*Bilety\s*:/i, "").trim();
            }
            return "";
          })();

          const sourceUrlMatch = pHtml.match(/href="([^"]+)"/);
          let sourceUrl = sourceUrlMatch ? decodeEntities(sourceUrlMatch[1]) : url;
          if (sourceUrl.startsWith("/")) sourceUrl = `https://kultura.poznan.pl${sourceUrl}`;

          const price = (() => {
            const raw = detailsStr || fullText;
            const m = raw.match(/(?:bilety?\s*(?:od\s*[-–]?\s*)?|cena\s*(?:od\s*[-–]?\s*)?)(\d+(?:\s*[.,]\s*\d{2})?)\s*(?:zł|PLN)/i);
            if (m) return `${m[1].replace(/\s/g, "").replace(",", ".")} zł`;
            if (/(?:wstęp|udział)\s+(?:wolny|bezpłatn)/i.test(raw)) return "0 zł";
            return undefined;
          })();

          const range = dataStr ? parseKulturaDateRange(dataStr, pageMonth, pageYear) : null;

          // No parsable Data field → the block may be a section listing sub-events
          // ("Wybrane koncerty", "Koncerty Filharmonii Poznańskiej", ...).
          if (!range) {
            // "Wybrane koncerty" style sections list "date - venue - title";
            // "Koncerty Filharmonii Poznańskiej" lists "date - title" (venue in
            // the Miejsce field), and its titles may themselves contain " - ".
            const splitVenue = segments.some((segment) => /^\s*[-–—•]/.test(segment)) && !/filharmoni/i.test(rawTitle);
            const subs = parseSubEvents(segments, pageMonth, pageYear, splitVenue);
            const usable = subs.filter((s) => s.end.getTime() >= now.getTime() - 86400000);
            if (usable.length === 0) return;

            const sectionVenue = venueStr ? cleanPlaceName(venueStr) : "";
            const sectionCategory = /koncert|filharmoni|muzyczn/i.test(rawTitle)
              ? "Muzyka"
              : /spektakl|teatr|kabaret|balet/i.test(rawTitle)
                ? "Teatr"
                : null;
            for (const sub of usable) {
              const place = sub.venue || sectionVenue || "Poznań";
              const category = sectionCategory ?? classifyCategory(sub.title, undefined, place) ?? "Inne";
              const venueData = matchVenue(place) ?? matchVenue(fullText);
              const sourceId = `kp-${Buffer.from(sub.title + new Date(Date.UTC(sub.start.getUTCFullYear(), sub.start.getUTCMonth(), sub.start.getUTCDate())).toISOString()).toString("base64").slice(0, 24)}`;
              const key = sourceId;
              if (seen.has(key)) continue;
              seen.add(key);
              events.push({
                title: sub.title,
                placeName: place,
                address: extractAddressFromVenue(sub.venue ? venueStr : place),
                district: venueData?.district ?? "Centrum",
                category,
                sourceUrl,
                startDate: sub.start,
                endDate: sub.end,
                time: undefined,
                vibes: guessVibes(sub.title, "", category),
                source: "kultura-poznan",
                sourceId,
                coordsX: venueData?.lat,
                coordsY: venueData?.lon,
                price,
              });
            }
            return;
          }

          // Ongoing/future only — keep exhibitions that started in the past.
          if (range.end.getTime() < now.getTime() - 86400000) return;

          // Recurring screenings with an explicit per-seance list.
          const screenings = parseScreenings(fullText);
          if (screenings.length >= 3) {
            for (const s of screenings) {
              if (s.date.getTime() < now.getTime() - 86400000) continue;
              const category = "Kino";
              const sourceId = `kp-${Buffer.from(s.title + s.date.toISOString()).toString("base64").slice(0, 24)}`;
              if (seen.has(sourceId)) continue;
              seen.add(sourceId);
              events.push({
                title: s.title,
                description: `${rawTitle} — ${s.title}`,
                placeName: cleanPlaceName(venueStr) || "Poznań",
                address: extractAddressFromVenue(venueStr),
                district: matchVenue(venueStr || fullText)?.district ?? "Centrum",
                category,
                sourceUrl,
                startDate: s.date,
                endDate: s.date,
                time: s.time,
                vibes: guessVibesForCategory(category),
                source: "kultura-poznan",
                sourceId,
                coordsX: matchVenue(venueStr || fullText)?.lat,
                coordsY: matchVenue(venueStr || fullText)?.lon,
                price,
              });
            }
            return;
          }

          const placeName = cleanPlaceName(venueStr) || "";
          const address = extractAddressFromVenue(venueStr) || undefined;
          const venueData = matchVenue(placeName) ?? matchVenue(`${placeName} ${fullText}`);
          const category = classifyCategory(rawTitle, description, placeName) ?? "Inne";
          const time = parseTimeFromData(dataStr);
          let startDate = range.start;
          if (time) {
            const ymd = dateKeyInWarsaw(startDate).split("-").map(Number);
            const [h, min] = time.split(":").map(Number);
            startDate = warsawDate(ymd[0], ymd[1] - 1, ymd[2], h, min);
          }
          const parentSourceId = `kp-${Buffer.from(rawTitle).toString("base64").slice(0, 24)}`;
          const key = `${parentSourceId}|${dateKeyInWarsaw(startDate)}`;
          if (seen.has(key)) return;
          seen.add(key);

          events.push({
            title: rawTitle,
            description: description || undefined,
            placeName: placeName || "Poznań",
            address,
            district: venueData?.district ?? "Centrum",
            category,
            sourceUrl,
            startDate,
            endDate: range.end,
            time,
            vibes: guessVibes(rawTitle, description, category),
            source: "kultura-poznan",
            sourceId: parentSourceId,
            coordsX: venueData?.lat,
            coordsY: venueData?.lon,
            price,
          });
        });
      } catch (e) {
        console.error(`[KulturaPoznan] ${monthName} failed:`, (e as Error).message);
      }
    }

    // Geocode remaining venues (Nominatim is rate-limited to 1 req/s internally).
    for (const ev of events) {
      if (ev.coordsX != null && ev.coordsY != null) continue;
      const geo = await geocodeVenue(ev.placeName, ev.title, ev.address);
      if (geo) {
        ev.coordsX = geo.lat;
        ev.coordsY = geo.lon;
        ev.district = geo.district;
      }
    }

    // Final fallback: district centre for anything still unlocated.
    for (const ev of events) {
      if (ev.coordsX != null && ev.coordsY != null) continue;
      const center = districtFallback(ev.district);
      ev.coordsX = center.lat;
      ev.coordsY = center.lon;
      ev.district = center.district;
    }

    console.log(`[KulturaPoznan] ${events.length} events`);
    return events;
  }
}
