import { prisma } from "@/lib/prisma";

export async function getRecommendations(userId: string, limit = 10) {
  // 1. Get category/district counts in a single query (no full includes)
  const attended = await prisma.attendance.findMany({
    where: { userId, status: "GOING" },
    select: { eventId: true, event: { select: { category: true, district: true } } },
  });

  const attendedIds = new Set(attended.map((a) => a.eventId));
  const catWeight: Record<string, number> = {};
  const districtWeight: Record<string, number> = {};
  for (const a of attended) {
    catWeight[a.event.category] = (catWeight[a.event.category] || 0) + 1;
    districtWeight[a.event.district] = (districtWeight[a.event.district] || 0) + 1;
  }

  // 2. Get upcoming events (top 100 by score), exclude already attended
  const upcoming = await prisma.event.findMany({
    where: {
      endDate: { gte: new Date() },
      ...(attendedIds.size > 0 ? { id: { notIn: Array.from(attendedIds) } } : {}),
    },
    orderBy: { score: "desc" },
    take: 100,
  });

  // 3. Score in JS (fast — max 100 items × ~10 categories)
  const scored = upcoming
    .map((e) => {
      let score = e.score;
      if (catWeight[e.category]) score += catWeight[e.category] * 15;
      if (districtWeight[e.district]) score += districtWeight[e.district] * 10;
      return { ...e, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  return scored;
}
