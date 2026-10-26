// Shared text/date helpers for scrapers (cleaning, category classification, Europe/Warsaw dates).
import { matchVenue, VENUES } from "@/lib/venues";

// ---------------------------------------------------------------------------
// Entities & HTML
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d",
  laquo: "\u00ab", raquo: "\u00bb", copy: "\u00a9", reg: "\u00ae",
  oacute: "\u00f3", aacute: "\u00e1", eacute: "\u00e9", iacute: "\u00ed",
  uacute: "\u00fa", zacute: "\u017a", ccedil: "\u00e7", ntilde: "\u00f1",
  szlig: "\u00df", bull: "\u2022", middot: "\u00b7", times: "\u00d7",
  euro: "\u20ac", pound: "\u00a3", deg: "\u00b0", sect: "\u00a7",
};

/** Decode HTML entities, including numeric ones and the ones Polish sites emit. */
export function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-z][a-z0-9]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

/** Strip HTML tags; <br>/block tags become newlines. */
export function stripHtmlTags(input: string): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<(?:script|style|noscript|iframe)[\s\S]*?<\/(?:script|style|noscript|iframe)>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

/** Decode entities + strip HTML (handles both raw HTML and entity-encoded HTML). */
export function htmlToText(input: string | undefined | null): string {
  if (!input) return "";
  return decodeEntities(stripHtmlTags(decodeEntities(stripHtmlTags(input))))
    .replace(/\\r\\n|\\n|\\r/g, " ")
    .replace(/\\t/g, " ");
}

/** Replace no-break/zero-width whitespace, tabs, CR and collapse repeated spaces. */
export function normalizeSpace(input: string): string {
  return (input ?? "")
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\u200b\ufeff]/g, " ")
    .replace(/[\t\r\f\v]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

/** Collapse spaces but keep paragraph-ish newlines (max one blank line). */
export function normalizeBlock(input: string): string {
  return (input ?? "")
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\u200b\ufeff]/g, " ")
    .replace(/[\t\r\f\v]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

const TITLE_SEO_TAIL =
  /\s*\|\s*(?:koncert|koncerty|spektakl|spektakle|warsztaty|wystawa|wystawy|festiwal|wydarzenie|wydarzenia|recital|stand-?up|impreza|kino)\s+w\s+(?:poznaniu|poznan)\s*$/i;
const TITLE_DATE_TAIL =
  /\s*[,(–—\-]\s*\d{1,2}[.\/]\d{1,2}(?:[.\/]\d{2,4})?\s*(?:r\.|roku)?\s*\)?\s*$/;
const TITLE_EDGE = /^[\s\-–—|,;:•*>]+|[\s\-–—|,;:•*<]+$/g;

/**
 * Normalize a scraped title: decode entities, collapse whitespace, strip SEO
 * suffixes ("– Bilety", "| koncert w Poznaniu"), trailing dates and stray edges.
 * Returns "" when nothing meaningful remains (caller should skip the event).
 */
export function cleanTitle(raw: string): string {
  let t = normalizeSpace(htmlToText(raw));
  // Strip "Bilety" suffix in every variant sites use: "– Bilety", "| Bilety – ..."
  t = t.replace(/\s*[|–—\-]\s*[Bb]ilety\s*$/g, "");
  t = t.replace(/\s*[|–—\-]\s*[Bb]ilety\s*[–—\-|]\s*.*$/g, "");
  t = t.replace(/\s*[Bb]ilety\s*$/g, "");
  // SEO tail: "| koncert w Poznaniu"
  t = t.replace(TITLE_SEO_TAIL, "");
  // trailing date, e.g. "Wystawa – 21.11.2026", "Koncert (12.05)"
  for (let i = 0; i < 2; i++) t = t.replace(TITLE_DATE_TAIL, "");
  t = t.replace(TITLE_EDGE, "");
  t = normalizeSpace(t);
  // A title must contain at least one letter; otherwise it is a date/metadata row.
  if (!/\p{L}/u.test(t)) return "";
  return t;
}

// ---------------------------------------------------------------------------
// Descriptions
// ---------------------------------------------------------------------------

const DESC_METADATA_INLINE =
  /(?:\s|\n|^)(?:Data|Miejsce|Lokalizacja|Bilety|Organizator|Organizatorzy|Wykonawca|Tagi|Więcej|Wiecej|Cena|Ceny|Kontakt|Rezerwacja|Godzina|Godziny|Wstęp|Wstep|Informacje|Zapisy|Produkcja|Reżyseria|Rezyseria|Choreografia|Scenografia|Obsada|Czas trwania|Wiek|Bilety? w cenie)\s*:/i;
const DESC_MARKETING_TAIL =
  /\s*(?:Czytaj (?:więcej|dalej)|Dowiedz się więcej|Zobacz (?:więcej|więcej)|KUP (?:BILET|BILETY)|Kup bilet|Zarezerwuj|Bilety dostępne|Źródło\s*:).*$/i;

/**
 * Clean a scraped description: decode entities, strip HTML, cut at the first
 * metadata block (Data:/Miejsce:/Bilety:/Organizator: ...), drop marketing tails,
 * collapse whitespace and cap length at a sentence boundary.
 */
export function cleanDescription(raw: string | undefined | null, maxLen = 900): string | undefined {
  if (!raw) return undefined;
  let d = htmlToText(raw);
  // Cut everything from the first metadata marker (inline or line-leading).
  d = d.split(DESC_METADATA_INLINE)[0];
  d = d.replace(DESC_MARKETING_TAIL, "");
  d = normalizeBlock(d);
  if (d.length > maxLen) {
    const cut = d.slice(0, maxLen);
    const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("\n"));
    d = lastStop > maxLen * 0.5 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + "…";
  }
  d = d.replace(/^[\s\-–—|,;:•]+|[\s\-–—|,;:]+$/g, "");
  return d.length >= 15 ? d : undefined;
}

// ---------------------------------------------------------------------------
// Places / venues
// ---------------------------------------------------------------------------

const VENUE_KEYS = Object.keys(VENUES).sort((a, b) => b.length - a.length);

/**
 * If the text starts with a known venue name (followed by a separator or a
 * short junk tail), return the canonical venue key. Fixes scraped names like
 * "Tama | Klub" or "Aula Artis – Collegium Da Vinci – Nadchodzące wydarzenia".
 */
export function canonicalVenueName(text: string): string | null {
  const lower = text.toLowerCase();
  for (const key of VENUE_KEYS) {
    const k = key.toLowerCase();
    if (!lower.startsWith(k)) continue;
    const rest = text.slice(key.length).trim();
    if (!rest) return key;
    if (/^[-–—|,;/].*$/.test(rest) && rest.length <= 40) return key;
  }
  return null;
}

const VENUE_NAME_JUNK = /[|]|\s[–—-]\s|\sw\s+Poznaniu|\sim\.|\s\/\s|\d{2}-\d{3}\s+Poznań?/i;

/**
 * If the (long) text contains a known venue name, return the longest matching
 * canonical venue key. Only used when the raw name carries junk descriptors
 * ("Kino Helios | Poznań", "Aula Nova Akademii Muzycznej w Poznaniu", ...).
 */
export function canonicalVenueFromText(text: string): string | null {
  const data = matchVenue(text);
  if (!data) return null;
  for (const key of Object.keys(VENUES)) {
    if (VENUES[key] === data) return key;
  }
  return null;
}

/**
 * Normalize a scraped venue/place name: decode entities, remove newlines /
 * script grains, addresses glued on with "ul.", metadata tails, postcodes and
 * stray edge characters; canonicalize known venues.
 */
export function cleanPlaceName(raw: string | undefined | null): string {
  if (!raw) return "";
  let p = normalizeSpace(htmlToText(raw));
  // Scraped jQuery text() often glues "venue\t\n ..." — keep the first chunk.
  p = p.split(/\n/)[0] ?? p;
  p = p
    .replace(/\s*[–—\-]\s*Nadchodzące wydarzenia.*$/i, "")
    .replace(/\s*[–—\-]\s*Nadchodzace wydarzenia.*$/i, "")
    .replace(/\s*(?:Więcej|Wiecej)\s*(?:informacji)?\s*:.*$/i, "")
    .replace(/\s*Organizator(?:zy)?\s*:.*$/i, "")
    .replace(/\s*Bilety\s*:.*$/i, "")
    .replace(/\s*Wstęp\s*wolny.*$/i, "")
    .replace(/\s*,\s*(?:ul\.|al\.|Aleje|pl\.|Plac|os\.)\s+.*$/i, "")
    .replace(/\s*\d{2}-\d{3}\s+(?:Poznań|Poznan)\s*$/i, "")
    .replace(/^(?:w|we)\s+/i, "")
    .replace(/^[\s\-–—|,;:•]+/g, "")
    .replace(/[\s\-–—|,;:]+$/g, "");
  p = normalizeSpace(p);
  const canonical = canonicalVenueName(p);
  if (canonical) return canonical;
  if (VENUE_NAME_JUNK.test(p)) {
    const fromMatch = canonicalVenueFromText(p);
    if (fromMatch) return fromMatch;
  }
  return p;
}

/** Extract a street address from a scraped "venue, ul. Foo 1" string. */
export function cleanAddress(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const a = normalizeSpace(htmlToText(raw))
    .replace(/\s*(?:Więcej|Wiecej|Organizator(?:zy)?|Bilety|Wstęp)\s*:?.*$/i, "")
    .replace(/^[\s\-–—|,;:]+|[\s\-–—|,;:]+$/g, "")
    .replace(/^(?:ul|al)\.\s*ul\.\s*/i, "ul. ");
  return a.length >= 3 ? a : undefined;
}

/** Best-effort street extraction from a venue string: "Aula UAM, ul. Wieniawskiego 1". */
export function extractAddressFromVenue(venue: string): string | undefined {
  const m = venue.match(/((?:ul\.|al\.|Aleje|pl\.|Plac|os\.)\s+[^,;]+?(?:\s+\d+[a-zA-Z]?)?)(?:[,;]|$)/i);
  return m ? cleanAddress(m[1]) : undefined;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORY_RULES: [string, RegExp][] = [
  ["Kino", /kino|film|seans|projekcj|pokaz film|kinow|festival film|przegląd film/i],
  ["Muzyka", /koncert|muzyk|recital|wokal|opera\b|operetk|filharmon|orkiestr|jazz|rock\b|rap\b|hip.?hop|dj\b|chór|chorał|festiwal muzyczn|koncertow/i],
  ["Teatr", /teatr|spektakl|musical|balet|pantomim|stand.?up|kabaret|monodram|improvizacj|performance aktorsk/i],
  ["Warsztaty", /warsztat|kurs\b|szkolen|lekcj|zajęcia|zajecia|edukacj|dla dzieci|dla rodzin|rodzinne/i],
  ["Sztuka", /wystaw|wernisaż|wernisaz|ekspozycj|galeri[ai]|malarstw|rzeźb|fotografi|grafiki|plakat|instalacj|sztuk[ai]|design|architektur|muzealn|oprowadzanie|zwiedzanie/i],
  ["Sport", /sport|bieg\b|maraton|turniej|mecz|zawody|fitness|jog\b|rower|pływani|triathlon|joga|yoga|crossfit|siłowni/i],
  ["Konferencje", /konferencj|wykład|wyklad|prelekcj|debata|panel|seminari|spotkanie autorskie|sympozjum|kongres/i],
  ["Jedzenie", /degustac|kulinar|kuchni|jedzen|kawiarni|restauracj|jarmark|targi|targow|wino|piwo|kaw[ay]|food|gotowani|świąteczn/i],
];

const CATEGORY_NAMES = new Set([
  "Muzyka", "Teatr", "Kino", "Sztuka", "Sport", "Warsztaty", "Konferencje", "Jedzenie", "Inne",
]);

export function isKnownCategory(c: string | undefined | null): c is string {
  return !!c && CATEGORY_NAMES.has(c);
}

/**
 * Keyword category classifier shared by all scrapers. Returns null when the
 * text gives no signal (caller keeps "Inne").
 */
export function classifyCategory(title: string, description?: string, placeName?: string): string | null {
  const text = `${title} ${description ?? ""} ${placeName ?? ""}`.toLowerCase();
  // "koncert w Teatrze" is a concert, not a play.
  if (/koncer/.test(text) && /teatr/.test(text)) return "Muzyka";
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat;
  return null;
}

// ---------------------------------------------------------------------------
// Dates & times (Europe/Warsaw)
// ---------------------------------------------------------------------------

export const POLISH_MONTHS: Record<string, number> = {
  styczen: 0, stycznia: 0, styczen_2026: 0,
  luty: 1, lutego: 1,
  marzec: 2, marca: 2,
  kwiecien: 3, kwietnia: 3,
  maj: 4, maja: 4,
  czerwiec: 5, czerwca: 5,
  lipiec: 6, lipca: 6,
  sierpien: 7, sierpnia: 7,
  wrzesien: 8, wrzesnia: 8, września: 8,
  pazdziernik: 9, pazdziernika: 9, października: 9, październik: 9,
  listopad: 10, listopada: 10,
  grudzien: 11, grudnia: 11,
};

export function polishMonthIndex(name: string): number | null {
  const key = name.toLowerCase().replace(/[^a-ząćęłńóśźż]/g, "");
  if (key in POLISH_MONTHS) return POLISH_MONTHS[key];
  // fall back to a diacritics-insensitive lookup
  const ascii = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
  return ascii in POLISH_MONTHS ? POLISH_MONTHS[ascii] : null;
}

function warsawOffsetMinutes(date: Date): number {
  // Format the instant in Warsaw and compare against UTC to get the offset.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60000;
}

/** Build a Date from Europe/Warsaw wall-clock components (DST-correct). */
export function warsawDate(
  year: number, monthIndex: number, day: number, hour = 12, minute = 0
): Date {
  const naive = Date.UTC(year, monthIndex, day, hour, minute);
  const offset = warsawOffsetMinutes(new Date(naive));
  return new Date(naive - offset * 60000);
}

/** "HH:MM" of an instant in Europe/Warsaw. */
export function timeInWarsaw(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" of an instant in Europe/Warsaw. */
export function dateKeyInWarsaw(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Skip date-only/malformed values produced by the source. */
export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && Number.isFinite(d.getTime());
}

/** Days between two instants (a - b), positive when a is later. */
export function daysBetween(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / 86400000;
}

/**
 * Parse a source ISO date-time as Europe/Warsaw wall-clock time.
 * Scraped feeds sometimes carry a wrong offset (e.g. +02:00 after DST ended) or
 * no offset at all; interpreting the wall-clock components in Warsaw keeps the
 * calendar day and displayed time stable.
 */
export function parseSourceDate(value: string | undefined | null): { date: Date; allDay: boolean } | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? { date: parsed, allDay: false } : null;
  }
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const allDay = m[4] == null || (hour === 0 && minute === 0);
  return { date: warsawDate(year, month, day, allDay ? 12 : hour, allDay ? 0 : minute), allDay };
}

/** Parse "HH:MM" / "HH.MM" / comma-separated showtime lists; returns undefined if invalid. */
export function normalizeTime(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const text = normalizeSpace(htmlToText(raw));
  const matches = [...text.matchAll(/([01]?\d|2[0-3])\s*[:.]\s*([0-5]\d)/g)];
  if (matches.length === 0) return undefined;
  const times = matches.map((m) => `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`);
  return [...new Set(times)].join(", ");
}
