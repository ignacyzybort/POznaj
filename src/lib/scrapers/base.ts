import { PrismaClient } from "@prisma/client";
import { pointInDistrict } from "@/lib/geo";
import { calculateBaseScore } from "@/lib/scoring";
import {
  cleanTitle,
  cleanDescription,
  cleanPlaceName,
  cleanAddress,
  classifyCategory,
  isKnownCategory,
  normalizeTime,
  isValidDate,
  dateKeyInWarsaw,
} from "./text";

export interface ScrapedEvent {
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  startDate: Date;
  endDate: Date;
  time?: string;
  placeName: string;
  address?: string;
  district: string;
  category: string;
  vibes: string[];
  source: string;
  sourceId: string;
  coordsX?: number;
  coordsY?: number;
  price?: string;
  outdoor?: boolean;
}

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedEvent[]>;
}

const DISTRICTS = new Set(["Centrum", "StareMiasto", "NoweMiasto", "Jezyce", "Grunwald", "Wilda", "Inny"]);

const STOPWORDS = new Set(["w", "i", "na", "z", "do", "się", "po", "od", "za", "przed", "pod", "nad", "przy", "dla", "bez", "oraz", "ale", "lub", "the", "a", "an", "of", "to", "is", "it", "dla", "nie", "że", "jak", "co"]);

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t)));
}

function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  const intersection = new Set([...ta].filter((x) => tb.has(x)));
  const union = new Set([...ta, ...tb]);
  return intersection.size / union.size;
}

function containsTitle(a: string, b: string): boolean {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const sm = ta.size < tb.size ? ta : tb;
  const lg = ta.size >= tb.size ? ta : tb;
  return sm.size >= 2 && [...sm].every((t) => lg.has(t));
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const OUTDOOR_KEYWORDS = [
  "park", "ogród", "jezioro", "rusałka", "cytadela", "plaża",
  "rynek", "plac", "skwer", "bulwar", "wyspa", "promenada",
  "amfiteatr", "scena plenerowa", "boisko", "stadion",
  "palmiarnia", "ogród botaniczny",
];

function containsWord(text: string, keyword: string): boolean {
  const re = new RegExp("\\b" + keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
  return re.test(text);
}

function detectOutdoor(placeName: string, description: string | undefined): boolean {
  const lowerDesc = description?.toLowerCase() ?? "";

  for (const kw of OUTDOOR_KEYWORDS) {
    if (containsWord(placeName, kw) || containsWord(lowerDesc, kw)) return true;
  }

  const exactOutdoor = [
    "park cytadela", "scena nad rusałką", "malta", "termy maltańskie",
    "stary rynek", "rynek łazarski", "plac wolności", "jezioro strzeszyńskie",
    "park sołacki", "park wilsona", "park kasprowicza", "tor regatowy malta",
    "enea stadion", "nowe zoo", "stare zoo", "ogród botaniczny uam",
    "palmiarnia poznańska", "tor poznań", "kontenerart",
    "letnia strefa", "scena plenerowa",
  ];
  const lowerName = placeName.toLowerCase();
  for (const ex of exactOutdoor) {
    if (lowerName.includes(ex)) return true;
  }

  return false;
}

/**
 * Shared normalization pass applied to every scraped event before it is
 * written. Scrapers should still emit structured dates/venues; this guard is
 * the last line of defence against contaminated text, bad dates and unknown
 * district/category values.
 */
export function sanitizeEvent(ev: ScrapedEvent): ScrapedEvent | null {
  ev.title = cleanTitle(ev.title);
  if (!ev.title) return null;

  ev.description = cleanDescription(ev.description);
  ev.placeName = cleanPlaceName(ev.placeName) || "Poznań";
  if (ev.address) ev.address = cleanAddress(ev.address);
  if (ev.imageUrl) ev.imageUrl = ev.imageUrl.trim();
  ev.sourceUrl = (ev.sourceUrl ?? "").trim();
  if (!ev.sourceUrl) return null;

  // Category: keep scraper-specific classification, only fall back to keywords
  // for "Inne"/invalid values.
  if (!isKnownCategory(ev.category) || ev.category === "Inne") {
    const guessed = classifyCategory(ev.title, ev.description, ev.placeName);
    if (guessed) ev.category = guessed;
    else if (!isKnownCategory(ev.category)) ev.category = "Inne";
  }

  ev.time = normalizeTime(ev.time);

  if (!isValidDate(ev.startDate)) return null;
  if (!isValidDate(ev.endDate) || ev.endDate.getTime() < ev.startDate.getTime()) {
    ev.endDate = new Date(ev.startDate);
  }

  // Sanity: drop coordinates that are not finite numbers.
  if (ev.coordsX != null && !Number.isFinite(ev.coordsX)) delete ev.coordsX;
  if (ev.coordsY != null && !Number.isFinite(ev.coordsY)) delete ev.coordsY;

  // District: always derive from coordinates when we have them (single source
  // of truth for the map), otherwise keep the scraper's guess.
  if (ev.coordsX != null && ev.coordsY != null) {
    const geoDistrict = pointInDistrict(ev.coordsX, ev.coordsY);
    if (geoDistrict) ev.district = geoDistrict;
  }
  if (!DISTRICTS.has(ev.district)) ev.district = "Inny";

  if (ev.outdoor === undefined) ev.outdoor = detectOutdoor(ev.placeName, ev.description);
  return ev;
}

const createData = (event: ScrapedEvent, vibes: string[]) => ({
  title: event.title,
  description: event.description,
  imageUrl: event.imageUrl,
  sourceUrl: event.sourceUrl,
  startDate: event.startDate,
  endDate: event.endDate,
  time: event.time,
  placeName: event.placeName,
  address: event.address,
  district: event.district as any,
  category: event.category as any,
  source: event.source,
  sourceId: event.sourceId,
  score: calculateBaseScore(event),
  coordsX: event.coordsX,
  coordsY: event.coordsY,
  price: event.price,
  outdoor: event.outdoor ?? false,
  vibes: { create: vibes.map((v) => ({ vibe: v as any })) },
});

const updateData = (event: ScrapedEvent, vibes: string[]) => {
  const d: Record<string, any> = {
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    sourceUrl: event.sourceUrl,
    startDate: event.startDate,
    endDate: event.endDate,
    time: event.time,
    placeName: event.placeName,
    address: event.address,
    category: event.category as any,
    source: event.source,
    score: calculateBaseScore(event),
    price: event.price,
    vibes: {
      deleteMany: {},
      create: vibes.map((v) => ({ vibe: v as any })),
    },
  };

  if (event.district && event.district !== "Inny") d.district = event.district;
  if (event.coordsX != null) d.coordsX = event.coordsX;
  if (event.coordsY != null) d.coordsY = event.coordsY;
  if (event.outdoor !== undefined) d.outdoor = event.outdoor;

  return d;
};

/**
 * Delete stale rows produced by an older, structurally broken parser (or by
 * earlier duplicate-prone runs) before/after saving fresh scrape output.
 *
 * `cutoff` must be the start of the current scrape run: rows touched by this
 * run (updatedAt >= cutoff) are never deleted. `phase = "pre"` removes rows
 * that would be re-created right away; `phase = "post"` removes near-duplicates
 * left behind when a corrected date no longer matches the stored one.
 */
export async function pruneLegacyEvents(
  prisma: PrismaClient,
  source: string,
  cutoff: Date,
  scraped: ScrapedKey[] = [],
  phase: "pre" | "post" = "pre"
): Promise<number> {
  const now = new Date();
  const rows = await prisma.event.findMany({
    where: {
      source,
      endDate: { gte: now },
      attendance: { none: {} },
      reminders: { none: {} },
      notifications: { none: {} },
      updatedAt: { lt: cutoff },
    },
    select: { id: true, sourceId: true, description: true, title: true, startDate: true },
  });

  const norm = (s: string) => s.toLowerCase().replace(/[^\wąćęłńóśźż]+/g, " ").replace(/\s+/g, " ").trim();
  let ids: string[] = [];

  if (source === "mnp" && phase === "pre") {
    // Old MNP sourceIds were `mnp/${title}|${place}|${isoDate}` and were built
    // from paragraph-like garbage titles.
    ids = rows.filter((r) => (r.sourceId ?? "").includes("|")).map((r) => r.id);
  } else if (source === "kultura-poznan" && phase === "pre") {
    // Old sub-event rows got `<section title> — <venue>` as their description.
    const legacyDesc = /^(?:Wybrane|Inne|Pozostałe|Wybrane i inne)\s+(?:koncerty|spektakle|wydarzenia)\b/i;
    ids = rows.filter((r) => legacyDesc.test(r.description ?? "")).map((r) => r.id);
  } else if (source === "kultura-poznan" && phase === "post") {
    // Date-parser bugs left duplicates of current events under a neighbouring
    // date. Keep occurrences that are present in the fresh scrape, drop the rest.
    const freshDates = new Map<string, Set<string>>();
    for (const item of scraped) {
      const key = norm(item.title);
      if (!key) continue;
      if (!freshDates.has(key)) freshDates.set(key, new Set());
      freshDates.get(key)!.add(dateKeyInWarsaw(item.startDate));
    }
    ids = rows
      .filter((r) => {
        const dates = freshDates.get(norm(r.title));
        return !!dates && !dates.has(dateKeyInWarsaw(r.startDate));
      })
      .map((r) => r.id);
  }

  if (ids.length === 0) return 0;
  const res = await prisma.event.deleteMany({ where: { id: { in: ids } } });
  return res.count;
}

/** Existing row metadata needed to keep cross-source attribution stable. */
interface ExistingSource {
  source: string;
  sourceId: string | null;
}

function existingSource(source: string, sourceId: string | null): ExistingSource {
  return { source, sourceId };
}

/**
 * Keep a row owned by the first source that created it. Only refresh sourceId
 * when the row already belongs to the scraping source (fixes legacy ids from
 * older parsers without "stealing" rows from another source).
 */
function withStableSourceId(
  data: Record<string, any>,
  existing: ExistingSource,
  ev: ScrapedEvent
): Record<string, any> {
  if (existing.source === ev.source && existing.sourceId !== ev.sourceId) {
    return { ...data, sourceId: ev.sourceId };
  }
  return data;
}

/** Minimal shape the pruning logic needs from a freshly scraped event. */
export interface ScrapedKey {
  title: string;
  startDate: Date;
  placeName: string;
  sourceId: string;
}

interface CollisionRow {
  id: string;
  _count: { attendance: number; reminders: number; notifications: number };
}

async function findUniqueKeyCollision(
  prisma: PrismaClient,
  data: { title: string; startDate: Date; placeName: string }
): Promise<CollisionRow | null> {
  return prisma.event.findFirst({
    where: { title: data.title, startDate: data.startDate, placeName: data.placeName },
    select: { id: true, _count: { select: { attendance: true, reminders: true, notifications: true } } },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/**
 * Update a row, resolving `@@unique([title, startDate, placeName])` collisions
 * left behind by earlier duplicate-prone runs: the stale duplicate is deleted
 * (unless a user attached attendance/reminders/notifications to it) and the
 * update is retried once.
 */
async function safeUpdate(
  prisma: PrismaClient,
  id: string,
  data: any
): Promise<"updated" | "collision-protected"> {
  try {
    await prisma.event.update({ where: { id }, data });
    return "updated";
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const colliding = await findUniqueKeyCollision(prisma, data as { title: string; startDate: Date; placeName: string });
    if (!colliding || colliding.id === id) throw error;
    const { attendance, reminders, notifications } = colliding._count;
    if (attendance > 0 || reminders > 0 || notifications > 0) return "collision-protected";
    await prisma.event.delete({ where: { id: colliding.id } });
    await prisma.event.update({ where: { id }, data });
    return "updated";
  }
}

/**
 * Create a row, merging into an existing row with the same unique key when one
 * is present (keeps the existing id and any user links instead of failing).
 */
async function safeCreate(
  prisma: PrismaClient,
  data: any
): Promise<{ id: string } | null> {
  try {
    return await prisma.event.create({ data });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const colliding = await findUniqueKeyCollision(prisma, data as { title: string; startDate: Date; placeName: string });
    if (!colliding) throw error;
    const { data: _, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
    await prisma.event.update({ where: { id: colliding.id }, data: rest });
    return { id: colliding.id };
  }
}

export async function saveEvents(
  prisma: PrismaClient,
  events: ScrapedEvent[]
): Promise<{ created: number; updated: number; errors: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Normalize + drop unusable events before any DB work
  const clean: ScrapedEvent[] = [];
  for (const raw of events) {
    const ev = sanitizeEvent(raw);
    if (ev) clean.push(ev);
    else skipped++;
  }

  const byDay = new Map<string, ScrapedEvent[]>();
  for (const ev of clean) {
    const dk = dayKey(ev.startDate);
    if (!byDay.has(dk)) byDay.set(dk, []);
    byDay.get(dk)!.push(ev);
  }

  for (const [, dayEvents] of byDay) {
    const start = new Date(dayEvents[0].startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const existing = await prisma.event.findMany({
      where: { startDate: { gte: start, lt: end } },
      select: { id: true, title: true, placeName: true, sourceId: true, source: true },
    });

    for (const ev of dayEvents) {
      try {
        const { vibes } = ev;

        // 1. Exact match
        const exact = existing.find(
          (e) => e.title === ev.title && e.placeName === ev.placeName
        );
        if (exact) {
          const res = await safeUpdate(prisma, exact.id, withStableSourceId(updateData(ev, vibes), existingSource(exact.source, exact.sourceId), ev));
          if (res === "collision-protected") { errors++; continue; }
          updated++;
          existing.push({ id: exact.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId, source: ev.source });
          continue;
        }

        // 2. SourceId match (same source, same event)
        const bySource = existing.find((e) => e.sourceId === ev.sourceId);
        if (bySource) {
          const res = await safeUpdate(prisma, bySource.id, withStableSourceId(updateData(ev, vibes), existingSource(bySource.source, bySource.sourceId), ev));
          if (res === "collision-protected") { errors++; continue; }
          updated++;
          existing.push({ id: bySource.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId, source: ev.source });
          continue;
        }

        // 3. Fuzzy match: containment check first, then Jaccard
        let best: { id: string; sim: number } | null = null;
        for (const e of existing) {
          if (containsTitle(ev.title, e.title)) {
            best = { id: e.id, sim: 1 };
            break;
          }
          const sim = similarity(ev.title, e.title);
          if (sim > 0.6 && sim > (best?.sim ?? 0)) {
            best = { id: e.id, sim };
          }
        }

        if (best) {
          const matchRow = existing.find((e) => e.id === best.id)!;
          const res = await safeUpdate(prisma, best.id, withStableSourceId(updateData(ev, vibes), existingSource(matchRow.source, matchRow.sourceId), ev));
          if (res === "collision-protected") { errors++; continue; }
          updated++;
          existing.push({ id: best.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId, source: ev.source });
        } else {
          const createdEvent = await safeCreate(prisma, createData(ev, vibes));
          if (!createdEvent) { errors++; continue; }
          created++;
          existing.push({ id: createdEvent.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId, source: ev.source });
        }
      } catch (e) {
        console.warn(`[saveEvents] Failed for "${ev.title}" (${ev.sourceId}):`, (e as Error).message?.slice(0, 120));
        errors++;
      }
    }
  }

  return { created, updated, errors, skipped };
}
