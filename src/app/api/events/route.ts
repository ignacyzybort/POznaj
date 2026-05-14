import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const districtsParam = searchParams.getAll("district");
  const categoriesParam = searchParams.getAll("category");
  const vibesParam = searchParams.getAll("vibe");
  const search = searchParams.get("search") || searchParams.get("q");
  const quick = searchParams.get("quick");
  const budget = searchParams.get("budget");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;
  const sort = searchParams.get("sort") || "date"; // "date" or "score"

  const now = new Date();
  const where: Prisma.EventWhereInput = {
    endDate: { gte: now },
  };

  if (districtsParam.length > 0) {
    where.district = { in: districtsParam as any };
  }
  if (categoriesParam.length > 0) {
    where.category = { in: categoriesParam as any };
  }
  if (vibesParam.length > 0) {
    where.vibes = { some: { vibe: { in: vibesParam as any } } };
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
