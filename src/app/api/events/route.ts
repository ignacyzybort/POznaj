import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, District, Category, Vibe } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

const SEARCH_MAX = 100;

function parseEnumArray<T extends Record<string, string>>(
  raw: string[],
  e: T,
): { values: T[keyof T][]; invalid: string[] } {
  const nonEmpty = raw.filter((v) => v !== "");
  const valid: T[keyof T][] = [];
  const invalid: string[] = [];
  for (const v of nonEmpty) {
    if (v in e) valid.push(v as T[keyof T]);
    else invalid.push(v);
  }
  return { values: valid, invalid };
}

function parseNonNegInt(raw: string | null, fallback: number): number | null {
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const districtsResult = parseEnumArray(searchParams.getAll("district"), District);
    const categoriesResult = parseEnumArray(searchParams.getAll("category"), Category);
    const vibesResult = parseEnumArray(searchParams.getAll("vibe"), Vibe);
    const firstInvalid = (() => {
      if (districtsResult.invalid.length) return { key: "district", values: districtsResult.invalid };
      if (categoriesResult.invalid.length) return { key: "category", values: categoriesResult.invalid };
      if (vibesResult.invalid.length) return { key: "vibe", values: vibesResult.invalid };
      return null;
    })();
    if (firstInvalid) {
      return NextResponse.json(
        { error: `Invalid ${firstInvalid.key} value(s): ${firstInvalid.values.join(", ")}` },
        { status: 400 },
      );
    }
    const districts = districtsResult.values;
    const categories = categoriesResult.values;
    const vibes = vibesResult.values;

    const rawSearch = searchParams.get("search") ?? searchParams.get("q");
    let search: string | null = null;
    if (rawSearch !== null) {
      const trimmed = rawSearch.trim();
      if (trimmed.length > SEARCH_MAX) {
        return NextResponse.json(
          { error: `Search must be ≤ ${SEARCH_MAX} chars` },
          { status: 400 },
        );
      }
      if (trimmed.length >= 2) search = trimmed;
    }

    const quick = searchParams.get("quick");
    const budget = searchParams.get("budget");
    const dateFromRaw = searchParams.get("dateFrom");
    const dateToRaw = searchParams.get("dateTo");

    const limitParsed = parseNonNegInt(searchParams.get("limit"), 50);
    const offsetParsed = parseNonNegInt(searchParams.get("offset"), 0);
    if (limitParsed === null || offsetParsed === null) {
      return NextResponse.json({ error: "limit and offset must be non-negative integers" }, { status: 400 });
    }
    const limit = Math.min(Math.max(limitParsed, 1), 200);
    const offset = offsetParsed;
    const sort = searchParams.get("sort") || "date";

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

    if (dateFromRaw) {
      const from = new Date(dateFromRaw);
      if (isNaN(from.getTime())) {
        return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
      }
      where.startDate = { ...(where.startDate as any || {}), gte: from };
    }
    if (dateToRaw) {
      const to = new Date(dateToRaw);
      if (isNaN(to.getTime())) {
        return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
      }
      to.setHours(23, 59, 59, 999);
      where.startDate = { ...(where.startDate as any || {}), lte: to };
    }

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

    return NextResponse.json(
      { events: serialized, total, recommended },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    console.error("[events] fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
