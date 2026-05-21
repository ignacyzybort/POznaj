import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VenueClient from "./venue-client";

function slugToSearch(slug: string) {
  return slug.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function slugToLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w{1}/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = slugToLabel(slug);
  return { title: `${label} | POznaj`, description: `Nadchodzace wydarzenia w ${label}, Poznan` };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const search = slugToSearch(slug);
  const label = slugToLabel(slug);

  const events = await prisma.event.findMany({
    where: { endDate: { gte: new Date() }, placeName: { contains: search, mode: "insensitive" } },
    orderBy: { startDate: "asc" },
    take: 100,
    include: {
      _count: { select: { attendance: { where: { status: "GOING" } } } },
      vibes: { select: { vibe: true } },
    },
  });

  const serialized = events.map((e) => ({
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
    vibes: e.vibes?.map((v) => v.vibe) ?? [],
    source: e.source,
    score: e.score,
    price: e.price ?? undefined,
    outdoor: e.outdoor,
    coordsX: e.coordsX ?? undefined,
    coordsY: e.coordsY ?? undefined,
    going: e._count.attendance,
  }));

  const districts = [...new Set(events.map((e) => e.district).filter(Boolean))];
  const categories = [...new Set(events.map((e) => e.category))];

  return <VenueClient slug={slug} label={label} events={serialized} districts={districts} categories={categories} />;
}
