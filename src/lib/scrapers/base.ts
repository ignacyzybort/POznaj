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

export async function saveEvents(
  prisma: PrismaClient,
  events: ScrapedEvent[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const { vibes, ...eventData } = event;

      await prisma.event.upsert({
        where: {
          title_startDate_placeName: {
            title: event.title,
            startDate: event.startDate,
            placeName: event.placeName,
          },
        },
        update: {
          description: event.description,
          imageUrl: event.imageUrl,
          sourceUrl: event.sourceUrl,
          endDate: event.endDate,
          time: event.time,
          address: event.address,
          district: event.district as any,
          category: event.category as any,
          source: event.source,
          score: 0,
          coordsX: event.coordsX,
          coordsY: event.coordsY,
          vibes: {
            deleteMany: {},
            create: vibes.map((v) => ({ vibe: v as any })),
          },
        },
        create: {
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
          coordsX: event.coordsX,
          coordsY: event.coordsY,
          vibes: {
            create: vibes.map((v) => ({ vibe: v as any })),
          },
        },
      });
      created++;
    } catch (e) {
      errors++;
    }
  }

  return { created, updated, errors };
}
