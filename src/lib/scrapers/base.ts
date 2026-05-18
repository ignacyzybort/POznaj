import { PrismaClient } from "@prisma/client";
import { pointInDistrict } from "@/lib/geo";

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
}

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedEvent[]>;
}

const STOPWORDS = new Set(["w", "i", "na", "z", "do", "się", "po", "od", "za", "przed", "pod", "nad", "przy", "dla", "bez", "oraz", "ale", "lub", "the", "a", "an", "of", "to", "is", "it", "dla", "nie", "że", "jak", "co"]);

function decodeEntities(s: string): string {
  return s.replace(/&#8211;/g, '\u2013').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function cleanTitle(t: string): string {
  return t.replace(/\s*[–\u2013\u2014\-—]\s*[Bb]ilety\s*$/g, "")
    .replace(/\s*\|\s*[Bb]ilety\s*$/g, "")
    .replace(/\s*[–\u2013]\s*[Bb]ilety\s*[–\u2013]\s*.+$/g, "")
    .replace(/&#8211;\s*Bilety/gi, "")
    .trim();
}

function cleanPlaceName(s: string): string {
  return decodeEntities(s)
    .replace(/\s*[–\u2013]\s*Nadchodzące wydarzenia.*$/i, '')
    .replace(/\s*Więcej\s*(informacji)?:.*$/i, '')
    .replace(/\s*Organizator:.*$/i, '')
    .replace(/\s*Wstęp\s*wolny.*$/i, '')
    .replace(/,\s*ul\..*$/i, '')
    .replace(/\d{2}[-\s]\d{3}\s*Poznań?$/i, '')
    .trim();
}

function cleanDescription(desc: string): string {
  return desc.split(/\s*(?:Data:|Miejsce:|Lokalizacja:|Bilety:|Wykonawca:|Organizator:|Tagi:)/)[0]
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

const createData = (event: ScrapedEvent, vibes: string[]) => ({
  title: cleanTitle(event.title),
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
  score: 0,
  coordsX: event.coordsX,
  coordsY: event.coordsY,
  price: event.price,
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
    score: 0,
    price: event.price,
    vibes: {
      deleteMany: {},
      create: vibes.map((v) => ({ vibe: v as any })),
    },
  };

  if (event.district && event.district !== "Inny") d.district = event.district;
  if (event.coordsX) d.coordsX = event.coordsX;
  if (event.coordsY) d.coordsY = event.coordsY;

  return d;
};

export async function saveEvents(
  prisma: PrismaClient,
  events: ScrapedEvent[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  // Clean titles, placeNames, descriptions before any processing
  for (const ev of events) {
    ev.title = cleanTitle(ev.title);
    ev.placeName = cleanPlaceName(ev.placeName);
    if (ev.description) ev.description = cleanDescription(ev.description);
    if (ev.address) ev.address = decodeEntities(ev.address);
  }

  const byDay = new Map<string, ScrapedEvent[]>();
  for (const ev of events) {
    const dk = dayKey(ev.startDate);
    if (!byDay.has(dk)) byDay.set(dk, []);
    byDay.get(dk)!.push(ev);
  }

  for (const [dk, dayEvents] of byDay) {
    const start = new Date(dayEvents[0].startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const existing = await prisma.event.findMany({
      where: { startDate: { gte: start, lt: end } },
      select: { id: true, title: true, placeName: true, sourceId: true },
    });

    for (const ev of dayEvents) {
      try {
        const { vibes } = ev;

        if (ev.coordsX) {
          const geoDistrict = pointInDistrict(ev.coordsX, ev.coordsY!);
          if (geoDistrict) ev.district = geoDistrict;
        }

        // 1. Exact match
        const exact = existing.find(
          (e) => e.title === ev.title && e.placeName === ev.placeName
        );
        if (exact) {
          await prisma.event.update({ where: { id: exact.id }, data: updateData(ev, vibes) });
          updated++;
          existing.push({ id: exact.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId });
          continue;
        }

        // 2. SourceId match (same source, same event)
        const bySource = existing.find((e) => e.sourceId === ev.sourceId);
        if (bySource) {
          await prisma.event.update({ where: { id: bySource.id }, data: updateData(ev, vibes) });
          updated++;
          existing.push({ id: bySource.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId });
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
          await prisma.event.update({ where: { id: best.id }, data: updateData(ev, vibes) });
          updated++;
          existing.push({ id: best.id, title: ev.title, placeName: ev.placeName, sourceId: ev.sourceId });
        } else {
          await prisma.event.create({ data: createData(ev, vibes) });
          created++;
        }
      } catch (e) {
        console.warn(`[saveEvents] Failed for "${ev.title}" (${ev.sourceId}):`, (e as Error).message?.slice(0, 100));
        errors++;
      }
    }
  }

  return { created, updated, errors };
}
