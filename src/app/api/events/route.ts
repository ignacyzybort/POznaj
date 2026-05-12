import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBaseScore, UserPreferences } from "@/lib/scoring";
import { District, Category, Vibe, Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const districtsParam = searchParams.getAll("district");
  const categoriesParam = searchParams.getAll("category");
  const vibesParam = searchParams.getAll("vibe");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const preferences: UserPreferences = {
    preferredCategories: searchParams.getAll("prefCategory"),
    preferredDistricts: searchParams.getAll("prefDistrict"),
    preferredVibes: searchParams.getAll("prefVibe"),
  };

  const where: Prisma.EventWhereInput = {
    endDate: { gte: new Date() },
  };

  if (districtsParam.length > 0) {
    where.district = { in: districtsParam as District[] };
  }
  if (categoriesParam.length > 0) {
    where.category = { in: categoriesParam as Category[] };
  }
  if (vibesParam.length > 0) {
    where.vibes = {
      some: {
        vibe: { in: vibesParam as Vibe[] },
      },
    };
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { placeName: { contains: search } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: { vibes: { select: { vibe: true } } },
    orderBy: { startDate: "asc" },
    take: limit,
    skip: offset,
  });

  const hasPrefs =
    preferences.preferredCategories.length > 0 ||
    preferences.preferredDistricts.length > 0 ||
    preferences.preferredVibes.length > 0;

  let scored = events.map((event) => {
    const vibeValues = event.vibes.map((v) => v.vibe);
    let score = calculateBaseScore(event);
    if (hasPrefs) {
      if (preferences.preferredCategories.includes(event.category))
        score *= 1.25;
      if (preferences.preferredDistricts.includes(event.district))
        score *= 1.15;
      if (
        vibeValues.some((v) => preferences.preferredVibes.includes(v))
      ) {
        score *= 1.25;
      }
    }
    return { ...event, score: Math.round(score), vibeValues };
  });

  scored.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const total = await prisma.event.count({ where });

  const serialized = scored.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    vibes: e.vibeValues,
  }));

  return NextResponse.json({ events: serialized, total });
}
