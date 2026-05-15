import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EventDetailClient, { type InitialEvent } from "./event-detail-client";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { vibes: { select: { vibe: true } } },
  });

  if (!event) notFound();

  const similarRaw = await prisma.event.findMany({
    where: {
      id: { not: id },
      category: event.category,
      endDate: { gte: new Date() },
    },
    orderBy: { score: "desc" },
    take: 4,
  });

  const initial: InitialEvent = {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
    sourceUrl: event.sourceUrl,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    time: event.time ?? undefined,
    placeName: event.placeName,
    address: event.address ?? undefined,
    district: event.district,
    category: event.category,
    vibes: event.vibes.map((v) => v.vibe),
    source: event.source,
    score: event.score,
    price: event.price ?? undefined,
    outdoor: event.outdoor,
    coordsX: event.coordsX ?? undefined,
    coordsY: event.coordsY ?? undefined,
  };

  const initialSimilar: InitialEvent[] = similarRaw.map((e) => ({
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
    vibes: [],
    source: e.source,
    score: e.score,
    price: e.price ?? undefined,
    outdoor: e.outdoor,
    coordsX: e.coordsX ?? undefined,
    coordsY: e.coordsY ?? undefined,
  }));

  return <EventDetailClient initial={initial} initialSimilar={initialSimilar} />;
}
