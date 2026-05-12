import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const districtsParam = searchParams.getAll("district");
  const categoriesParam = searchParams.getAll("category");
  const vibesParam = searchParams.getAll("vibe");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const where: Prisma.EventWhereInput = {
    endDate: { gte: new Date() },
  };

  if (districtsParam.length > 0) {
    where.district = { in: districtsParam as any };
  }
  if (categoriesParam.length > 0) {
    where.category = { in: categoriesParam as any };
  }
  if (vibesParam.length > 0) {
    where.vibes = {
      some: {
        vibe: { in: vibesParam as any },
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
  }));

  serialized.sort((a, b) => b.score - a.score);

  return NextResponse.json({ events: serialized, total });
}
