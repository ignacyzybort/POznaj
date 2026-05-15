import { PrismaClient } from "@prisma/client";

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
}

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedEvent[]>;
}

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

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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
  score: 0,
  coordsX: event.coordsX,
  coordsY: event.coordsY,
  vibes: { create: vibes.map((v) => ({ vibe: v as any })) },
});

const updateData = (event: ScrapedEvent, vibes: string[]) => {
  const d: Record<string, any> = {
    description: event.description,
    imageUrl: event.imageUrl,
    sourceUrl: event.sourceUrl,
    endDate: event.endDate,
    time: event.time,
    address: event.address,
    category: event.category as any,
    source: event.source,
    score: 0,
    vibes: {
      deleteMany: {},
      create: vibes.map((v) => ({ vibe: v as any })),
    },
  };

  // Guard: don't overwrite valid district/coords with placeholder values.
  // If the new data has no coordinates, keep what's already in the database.
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

  // Group by day to reduce queries
  const byDay = new Map<string, ScrapedEvent[]>();
  for (const ev of events) {
    const dk = dayKey(ev.startDate);
    if (!byDay.has(dk)) byDay.set(dk, []);
    byDay.get(dk)!.push(ev);
  }

  for (const [dk, dayEvents] of byDay) {
    // Fetch existing events for this day
    const start = new Date(dayEvents[0].startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const existing = await prisma.event.findMany({
      where: { startDate: { gte: start, lt: end } },
      select: { id: true, title: true, placeName: true },
    });

    for (const ev of dayEvents) {
      try {
        const { vibes } = ev;

        // 1. Try exact match first (fast path)
        const exact = existing.find(
          (e) => e.title === ev.title && e.placeName === ev.placeName
        );
        if (exact) {
          await prisma.event.update({
            where: { id: exact.id },
            data: updateData(ev, vibes),
          });
          updated++;
          continue;
        }

        // 2. Fuzzy match: find by date-close title similarity
        const THRESHOLD = 0.6;
        let best: { id: string; sim: number } | null = null;
        for (const e of existing) {
          const sim = similarity(ev.title, e.title);
          if (sim > THRESHOLD && sim > (best?.sim ?? 0)) {
            best = { id: e.id, sim };
          }
        }

        if (best) {
          await prisma.event.update({
            where: { id: best.id },
            data: updateData(ev, vibes),
          });
          updated++;
        } else {
          await prisma.event.create({
            data: createData(ev, vibes),
          });
          created++;
        }
      } catch (e) {
        errors++;
      }
    }
  }

  return { created, updated, errors };
}
