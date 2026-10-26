import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import VenueClient from "./venue-client";
import { getVenueLabel, getVenueSearch } from "@/lib/slug";

function slugToLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w{1}/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = getVenueLabel(slug) ?? slugToLabel(slug);
  return { title: `${label} | POznaj`, description: `Nadchodzace wydarzenia w ${label}, Poznan` };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const search = getVenueSearch(slug);

  const query = (where: Record<string, unknown>) =>
    prisma.event.findMany({
      where: { endDate: { gte: new Date() }, ...where } as never,
      orderBy: { startDate: "asc" },
      take: 100,
      include: {
        _count: { select: { attendance: { where: { status: "GOING" } } } },
        vibes: { select: { vibe: true } },
      },
    });

  let events = await query({ placeName: { contains: search, mode: "insensitive" } });

  // Fallback for place names whose punctuation/entities/diacritics do not
  // survive the slug round-trip: match on significant tokens instead of the
  // whole string, so new venues keep working without new slug overrides.
  if (events.length === 0) {
    const tokens = search
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 3)
      .slice(0, 4);
    const labelTokens = (getVenueLabel(slug) ?? "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 3)
      .slice(0, 4);
    const allTokens = [...new Set([...tokens, ...labelTokens])].slice(0, 4);
    if (allTokens.length > 0) {
      events = await query({ AND: allTokens.map((t) => ({ placeName: { contains: t, mode: "insensitive" } })) });
    }
  }

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
  const label = events[0]?.placeName ?? getVenueLabel(slug) ?? slugToLabel(slug);

  return <VenueClient label={label} events={serialized} districts={districts} categories={categories} />;
}
