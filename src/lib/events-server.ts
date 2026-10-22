import { prisma } from "@/lib/prisma";
import type { EventData } from "@/lib/data";

export type EventQueryOpts = {
  limit?: number;
  sort?: "date" | "score";
};

export async function getMapEvents(): Promise<EventData[]> {
  const events = await prisma.event.findMany({
    where: {
      endDate: { gte: new Date() },
      coordsX: { not: null },
      coordsY: { not: null },
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      sourceUrl: true,
      startDate: true,
      endDate: true,
      time: true,
      placeName: true,
      address: true,
      district: true,
      category: true,
      source: true,
      score: true,
      price: true,
      outdoor: true,
      coordsX: true,
      coordsY: true,
    },
    orderBy: [{ score: "desc" }, { startDate: "asc" }],
    take: 4000,
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    imageUrl: e.imageUrl ?? undefined,
    sourceUrl: e.sourceUrl,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    time: e.time ?? undefined,
    placeName: e.placeName,
    address: e.address ?? undefined,
    district: e.district,
    category: e.category,
    vibes: [],
    source: e.source,
    score: e.score,
    price: e.price ?? undefined,
    outdoor: e.outdoor,
    coordsX: e.coordsX ?? undefined,
    coordsY: e.coordsY ?? undefined,
  }));
}

export async function getEvents(opts: EventQueryOpts = {}): Promise<EventData[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const orderBy =
    opts.sort === "score"
      ? ([{ score: "desc" }, { startDate: "asc" }] as const)
      : ([{ startDate: "asc" }, { score: "desc" }] as const);

  const events = await prisma.event.findMany({
    where: { endDate: { gte: new Date() } },
    include: { vibes: { select: { vibe: true } } },
    orderBy: orderBy as never,
    take: limit,
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    imageUrl: e.imageUrl ?? undefined,
    sourceUrl: e.sourceUrl,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    time: e.time ?? undefined,
    placeName: e.placeName,
    address: e.address ?? undefined,
    district: e.district,
    category: e.category,
    vibes: e.vibes.map((v) => v.vibe),
    source: e.source,
    score: e.score,
    price: e.price ?? undefined,
    outdoor: e.outdoor,
    coordsX: e.coordsX ?? undefined,
    coordsY: e.coordsY ?? undefined,
  }));
}
