import { prisma } from "@/lib/prisma";

export async function getRecommendations(userId: string, limit = 10) {
  // 1. Get user's past GOING events
  const userEvents = await prisma.attendance.findMany({
    where: { userId, status: "GOING" },
    include: { event: { select: { category: true, district: true, id: true } } },
  });

  // 2. Build user profile: preferred categories + districts
  const catWeight: Record<string, number> = {};
  const districtWeight: Record<string, number> = {};
  for (const a of userEvents) {
    catWeight[a.event.category] = (catWeight[a.event.category] || 0) + 1;
    districtWeight[a.event.district] = (districtWeight[a.event.district] || 0) + 1;
  }

  // 3. Find upcoming events, score them based on user profile
  const upcoming = await prisma.event.findMany({
    where: { endDate: { gte: new Date() } },
    include: { vibes: { select: { vibe: true } } },
    take: 100,
  });

  const scored = upcoming
    .filter((e) => !userEvents.find((a) => a.event.id === e.id)) // exclude attended
    .map((e) => {
      let score = e.score; // start with base score
      // Boost by category match
      if (catWeight[e.category]) score += catWeight[e.category] * 15;
      // Boost by district match
      if (districtWeight[e.district]) score += districtWeight[e.district] * 10;
      return { ...e, recommendationScore: score };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);

  return scored;
}
