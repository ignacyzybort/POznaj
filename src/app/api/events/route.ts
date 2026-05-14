import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, District, Category, Vibe } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

const SEARCH_MAX = 100;

function filterEnum<T extends Record<string, string>>(values: string[], e: T): T[keyof T][] {
  return values.filter((v): v is T[keyof T] => v in e);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const districts = filterEnum(searchParams.getAll("district"), District);
  const categories = filterEnum(searchParams.getAll("category"), Category);
  const vibes = filterEnum(searchParams.getAll("vibe"), Vibe);
  const rawSearch = searchParams.get("search") || searchParams.get("q");
  const search =
    rawSearch && rawSearch.trim().length >= 2 && rawSearch.length <= SEARCH_MAX
      ? rawSearch.trim()
      : null;
  const quick = searchParams.get("quick");
  const budget = searchParams.get("budget");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const sort = searchParams.get("sort") || "date"; // "date" or "score"

  const now = new Date();
  const where: Prisma.EventWhereInput = {
    endDate: { gte: now },
  };

  if (districts.length > 0) {
    where.district = { in: districts };
  }
  if (categories.length > 0) {
    where.category = { in: categories };
  }
  if (vibes.length > 0) {
    where.vibes = { some: { vibe: { in: vibes } } };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { placeName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Quick date filters
  if (quick === "today") {
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    where.startDate = { gte: new Date(now.setHours(0, 0, 0, 0)), lte: end };
  } else if (quick === "tonight") {
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    where.startDate = { gte: new Date(now.setHours(0, 0, 0, 0)), lte: end };
    where.time = { gte: "18:00" };
  } else if (quick === "tomorrow") {
    const t = new Date(now); t.setDate(t.getDate() + 1);
    const end = new Date(t); end.setHours(23, 59, 59, 999);
    where.startDate = { gte: new Date(t.setHours(0, 0, 0, 0)), lte: end };
  } else if (quick === "weekend") {
    const fri = new Date(now); fri.setDate(fri.getDate() + ((5 - fri.getDay() + 7) % 7));
    const sun = new Date(fri); sun.setDate(sun.getDate() + 2); sun.setHours(23, 59, 59, 999);
    where.startDate = { gte: fri, lte: sun };
  } else if (quick === "week") {
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
    where.startDate = { gte: now, lte: weekEnd };
  }

  // Custom date range
  if (dateFrom) {
    const from = new Date(dateFrom);
    where.startDate = { ...(where.startDate as any || {}), gte: from };
  }
  if (dateTo) {
    const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
    where.startDate = { ...(where.startDate as any || {}), lte: to };
  }

  // Budget filters
  if (budget === "free") {
    where.OR = [
      ...((where.OR as any[]) || []),
      { price: { startsWith: "0" } },
      { price: { contains: "free", mode: "insensitive" as any } },
      { price: { contains: "bezpł", mode: "insensitive" as any } },
      { price: { contains: "wolny", mode: "insensitive" as any } },
    ];
  } else if (budget === "cheap") {
    where.OR = [
      ...((where.OR as any[]) || []),
      { price: { startsWith: "0" } },
      { price: { contains: "free", mode: "insensitive" as any } },
      { price: { lte: "45" } },
    ];
  } else if (budget === "student") {
    where.OR = [
      ...((where.OR as any[]) || []),
      { price: { startsWith: "0" } },
      { price: { contains: "free", mode: "insensitive" as any } },
    ];
  }

  const orderBy: Prisma.EventOrderByWithRelationInput[] =
    sort === "score"
      ? [{ score: "desc" }, { startDate: "asc" }]
      : [{ startDate: "asc" }, { score: "desc" }];

  const events = await prisma.event.findMany({
    where,
    include: { vibes: { select: { vibe: true } } },
    orderBy,
    take: limit,
    skip: offset,
  });

  const total = await prisma.event.count({ where });

  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    imageUrl: e.imageUrl,
    sourceUrl: e.sourceUrl,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    time: e.time,
    placeName: e.placeName,
    address: e.address,
    district: e.district,
    category: e.category,
    vibes: e.vibes.map((v) => v.vibe),
    source: e.source,
    score: e.score,
    price: e.price,
    outdoor: e.outdoor,
    coordsX: e.coordsX,
    coordsY: e.coordsY,
  }));

  // Compute recommendations if requested
  let recommended: any[] | null = null;
  if (searchParams.get("recommended") === "true") {
    const session = await auth();
    if (session?.user?.id) {
      const recs = await getRecommendations(session.user.id, 5);
      recommended = (recs as any[]).map((e) => ({
        id: e.id,
        title: e.title,
        placeName: e.placeName,
        district: e.district,
        category: e.category,
        score: e.recommendationScore,
        startDate: e.startDate.toISOString(),
        imageUrl: e.imageUrl,
      }));
    }
  }

  return NextResponse.json({ events: serialized, total, recommended });
}
