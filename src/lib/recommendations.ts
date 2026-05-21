import { prisma } from "@/lib/prisma";

export async function getRecommendations(userId: string, limit = 10) {
  const attended = await prisma.attendance.findMany({
    where: { userId, status: "GOING" },
    select: { eventId: true, event: { select: { category: true, district: true } } },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredCategories: true, preferredVibes: true, district: true },
  });

  const attendedIds = new Set(attended.map((a) => a.eventId));
  const catWeight: Record<string, number> = {};
  const districtWeight: Record<string, number> = {};
  for (const a of attended) {
    catWeight[a.event.category] = (catWeight[a.event.category] || 0) + 1;
    districtWeight[a.event.district] = (districtWeight[a.event.district] || 0) + 1;
  }

  const upcoming = await prisma.event.findMany({
    where: {
      endDate: { gte: new Date() },
      ...(attendedIds.size > 0 ? { id: { notIn: Array.from(attendedIds) } } : {}),
    },
    include: { vibes: { select: { vibe: true } } },
    orderBy: { score: "desc" },
    take: 100,
  });

  const scored = upcoming
    .map((e) => {
      let score = e.score;
      if (catWeight[e.category]) score += catWeight[e.category] * 15;
      if (districtWeight[e.district]) score += districtWeight[e.district] * 10;
      if (user?.preferredCategories?.includes(e.category)) score += 20;
      if (user?.district && e.district === user.district) score += 10;
      if (user?.preferredVibes?.some((v) => e.vibes.some((ev) => ev.vibe === v))) score += 20;
      return { ...e, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  return scored;
}
