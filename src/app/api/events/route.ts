import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, District, Category, Vibe } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommendations";
import { districts as districtOptions } from "@/lib/data";
import { warsawToUtc } from "@/lib/warsaw-time";

const SEARCH_MAX = 100;
const PL_TZ = "Europe/Warsaw";

function warsawWeekday(date: Date): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: PL_TZ, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
}

function parseTimeTokens(time: string | null | undefined): number[] {
  if (!time) return [];
  const tokens: number[] = [];
  for (const raw of time.split(",")) {
    const match = raw.trim().match(/^(\d{1,2})[:.](\d{2})/);
    if (!match) continue;
    const minutes = Number(match[1]) * 60 + Number(match[2]);
    if (minutes >= 0 && minutes < 24 * 60) tokens.push(minutes);
  }
  return tokens;
}

function parsePriceNumbers(price: string | null | undefined): number[] {
  if (!price) return [];
  const matches = price.replace(/\s/g, "").match(/\d+(?:[.,]\d+)?/g) ?? [];
  return matches.map((m) => Number(m.replace(",", "."))).filter((n) => Number.isFinite(n));
}

function looksFree(price: string | null | undefined, title: string, description?: string | null): boolean {
  const haystack = `${price ?? ""} ${title} ${description ?? ""}`.toLowerCase();
  if (/bezpłat|darmow|wolny wstęp|free entry|wstęp wolny/.test(haystack)) return true;
  return parsePriceNumbers(price).some((n) => n === 0);
}

function looksCheap(price: string | null | undefined, title: string, description?: string | null): boolean {
  if (looksFree(price, title, description)) return true;
  const numbers = parsePriceNumbers(price);
  return numbers.length > 0 && Math.min(...numbers) <= 45;
}

function looksStudent(price: string | null | undefined, title: string, description?: string | null): boolean {
  return /studen|uczeln|akademick|juwenali|ulgow|ulga/.test(
    `${price ?? ""} ${title} ${description ?? ""}`.toLowerCase()
  );
}

function plDayStart(raw: string): Date | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return warsawToUtc(Number(match[1]), Number(match[2]), Number(match[3]), 0, 0);
}

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
      const query = search.toLowerCase();
      const matchedDistricts = districtOptions
        .filter((d) => d.label.toLowerCase().includes(query) || d.value.toLowerCase() === query)
        .map((d) => d.value as District);

      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { placeName: { contains: search, mode: "insensitive" } },
        ...(matchedDistricts.length > 0 ? [{ district: { in: matchedDistricts } }] : []),
      ];
    }

    if (quick === "today") {
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date()) };
    } else if (quick === "tonight") {
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date()) };
    } else if (quick === "tomorrow") {
      where.startDate = { gte: plMidnight(new Date(), 1), lte: plEndOfDay(new Date(), 1) };
    } else if (quick === "weekend") {
      const weekday = warsawWeekday(new Date());
      const offsetToFriday = weekday === 5 ? 0 : weekday === 6 ? -1 : weekday === 0 ? -2 : 5 - weekday;
      const friday = plMidnight(new Date(), offsetToFriday);
      where.startDate = { gte: friday, lte: plEndOfDay(new Date(), offsetToFriday + 2) };
    } else if (quick === "week") {
      where.startDate = { gte: plMidnight(new Date()), lte: plEndOfDay(new Date(), 7) };
    }

    if (dateFromRaw) {
      const from = plDayStart(dateFromRaw);
      if (!from) {
        return NextResponse.json({ error: "Invalid dateFrom" }, { status: 400 });
      }
      where.startDate = { ...(where.startDate as any || {}), gte: from };
    }
    if (dateToRaw) {
      const toStart = plDayStart(dateToRaw);
      if (!toStart) {
        return NextResponse.json({ error: "Invalid dateTo" }, { status: 400 });
      }
      where.startDate = { ...(where.startDate as any || {}), lte: new Date(toStart.getTime() + 86_399_999) };
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

    const candidates = await prisma.event.findMany({
      where,
      select: { id: true, title: true, description: true, price: true, time: true, startDate: true },
      orderBy,
    });

    const nowParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: PL_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()).split(":");
    const nowMinutes = Number(nowParts[0]) * 60 + Number(nowParts[1] ?? 0);
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: PL_TZ }).format(new Date());

    const isToday = (date: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: PL_TZ }).format(date) === todayStr;

    const filtered = candidates.filter((event) => {
      const slots = parseTimeTokens(event.time);

      // Today's events whose showtimes have all passed are not bookable anymore.
      if (slots.length > 0 && isToday(event.startDate) && !slots.some((m) => m > nowMinutes)) {
        return false;
      }

      if (quick === "tonight") {
        const evening = slots.filter(
          (m) => m >= 18 * 60 && (!isToday(event.startDate) || m > nowMinutes)
        );
        if (evening.length === 0) return false;
      }

      if (budget === "free" && !looksFree(event.price, event.title, event.description)) return false;
      if (budget === "cheap" && !looksCheap(event.price, event.title, event.description)) return false;
      if (budget === "student" && !looksStudent(event.price, event.title, event.description)) return false;

      return true;
    });

    const total = filtered.length;
    const pageIds = filtered.slice(offset, offset + limit).map((e) => e.id);

    const pageEvents = pageIds.length
      ? await prisma.event.findMany({
          where: { id: { in: pageIds } },
          include: {
            vibes: { select: { vibe: true } },
            _count: { select: { attendance: { where: { status: "GOING" } } } },
          },
        })
      : [];

    const byId = new Map(pageEvents.map((e) => [e.id, e]));
    const events = pageIds.map((id) => byId.get(id)).filter((e): e is NonNullable<typeof e> => Boolean(e));

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
      {
        headers: {
          "Cache-Control": currentUserId
            ? "private, no-store"
            : "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    console.error("[events] fetch error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
