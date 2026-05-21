import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, District, Category, Vibe } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";

const SEARCH_MAX = 100;
const PL_TZ = "Europe/Warsaw";

function plMidnight(baseDate: Date, daysOffset = 0): Date {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + daysOffset);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d).split("-");
  const [y, m, day] = parts.map(Number);

  const noonUTC = Date.UTC(y, m - 1, day, 12);
  const polandHour = +new Intl.DateTimeFormat("en-US", {
    timeZone: PL_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(noonUTC);
  const offsetMs = (polandHour - 12) * 3_600_000;

  return new Date(Date.UTC(y, m - 1, day) - offsetMs);
}

function plEndOfDay(baseDate: Date, daysOffset = 0): Date {
  const start = plMidnight(baseDate, daysOffset);
  return new Date(start.getTime() + 86_399_999);
}

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
    const outdoor = searchParams.get("outdoor");
    const place = searchParams.get("place");
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

    const now = plMidnight(new Date());
    const where: Prisma.EventWhereInput = {
      endDate: { gte: new Date() },
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
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date()) };
    } else if (quick === "tonight") {
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date()) };
      where.time = { gte: "18:00" };
    } else if (quick === "tomorrow") {
      where.startDate = { gte: plMidnight(new Date(), 1), lte: plEndOfDay(new Date(), 1) };
    } else if (quick === "weekend") {
      const fri = plMidnight(new Date());
      const dayOfWeek = fri.getUTCDay();
      const daysToFri = (5 - dayOfWeek + 7) % 7;
      fri.setUTCDate(fri.getUTCDate() + daysToFri);
      where.startDate = { gte: fri, lte: plEndOfDay(fri, 2) };
    } else if (quick === "week") {
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date(), 7) };
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
      const budgetOr: Record<string, any>[] = [
        { price: { startsWith: "0" } },
        { price: { contains: "free", mode: "insensitive" as any } },
        { price: { contains: "bezpł", mode: "insensitive" as any } },
        { price: { contains: "wolny", mode: "insensitive" as any } },
      ];
      where.AND = [...((where.AND as any[]) || []), { OR: budgetOr }];
    } else if (budget === "cheap") {
      const budgetOr: Record<string, any>[] = [
        { price: { startsWith: "0" } },
        { price: { contains: "free", mode: "insensitive" as any } },
        { price: { lte: "45" } },
      ];
      where.AND = [...((where.AND as any[]) || []), { OR: budgetOr }];
    } else if (budget === "student") {
      const budgetOr: Record<string, any>[] = [
        { price: { startsWith: "0" } },
        { price: { contains: "free", mode: "insensitive" as any } },
        { price: { contains: "bezpł", mode: "insensitive" as any } },
        { price: { contains: "studen", mode: "insensitive" as any } },
        { price: { contains: "ulgow", mode: "insensitive" as any } },
        { price: { contains: "ulga", mode: "insensitive" as any } },
      ];
      where.AND = [...((where.AND as any[]) || []), { OR: budgetOr }];
    }

    if (outdoor === "true") {
      where.outdoor = true;
    }

    if (place) {
      where.placeName = { contains: place, mode: "insensitive" };
    }

    const orderBy: Prisma.EventOrderByWithRelationInput[] =
      sort === "score"
        ? [{ score: "desc" }, { startDate: "asc" }]
        : [{ startDate: "asc" }, { score: "desc" }];

    const events = await prisma.event.findMany({
      where,
      include: {
        vibes: { select: { vibe: true } },
        _count: { select: { attendance: { where: { status: "GOING" } } } },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const total = await prisma.event.count({ where });

    const session = await auth();
    let friendGoingMap: Map<string, { name: string; image?: string }[]> = new Map();
    const currentUserId = session?.user?.id;

    if (currentUserId) {
      const friendIds = (
        await prisma.friendship.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          },
          select: { senderId: true, receiverId: true },
        })
      ).map((f) => (f.senderId === currentUserId ? f.receiverId : f.senderId));

      if (friendIds.length > 0) {
        const goingAttendances = await prisma.attendance.findMany({
          where: {
            userId: { in: friendIds },
            eventId: { in: events.map((e) => e.id) },
            status: "GOING",
          },
          select: {
            eventId: true,
            user: { select: { name: true, image: true } },
          },
        });
        for (const a of goingAttendances) {
          const list = friendGoingMap.get(a.eventId) ?? [];
          list.push({ name: a.user.name ?? "Znajomy", image: a.user.image ?? undefined });
          friendGoingMap.set(a.eventId, list);
        }
      }
    }

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
      going: e._count.attendance,
      friendsGoing: friendGoingMap.get(e.id) ?? [],
    }));

    let recommended: any[] | null = null;
    if (searchParams.get("recommended") === "true") {
      if (currentUserId) {
        const recs = await getRecommendations(currentUserId, 5);
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
