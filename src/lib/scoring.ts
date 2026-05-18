import { differenceInDays } from "date-fns";

export interface UserPreferences {
  preferredCategories: string[];
  preferredDistricts: string[];
  preferredVibes: string[];
}

export function calculateBaseScore(event: {
  startDate: Date;
  endDate: Date;
  imageUrl?: string | null;
  description?: string | null;
  time?: string | null;
  address?: string | null;
}): number {
  let score = 0;

  const now = new Date();
  const daysUntilStart = differenceInDays(event.startDate, now);
  const daysUntilEnd = differenceInDays(event.endDate, now);

  if (daysUntilEnd < 0) return 0;

  const daysUntil = daysUntilStart > 0 ? daysUntilStart : 0;

  if (daysUntil <= 7) score += 40;
  else if (daysUntil <= 21) score += 35;
  else if (daysUntil <= 60) score += 25;
  else if (daysUntil <= 180) score += 10;

  const completeness = [
    event.imageUrl,
    event.description,
    event.time,
    event.address,
  ].filter(Boolean).length;
  score += (completeness / 4) * 20;

  return score;
}

export function calculateAttendanceScore(goingCount: number): number {
  if (goingCount >= 501) return 40;
  if (goingCount >= 101) return 30;
  if (goingCount >= 21) return 20;
  if (goingCount >= 6) return 10;
  return 0;
}

export async function recomputeAllScores(prisma: {
  event: {
    findMany: (args: any) => Promise<any[]>;
    update: (args: any) => Promise<any>;
  };
}) {
  const events = await prisma.event.findMany({
    where: { endDate: { gte: new Date() } },
    include: { _count: { select: { attendance: { where: { status: "GOING" } } } } },
  });

  let updated = 0;
  for (const e of events) {
    const base = calculateBaseScore(e);
    const att = calculateAttendanceScore(e._count.attendance);
    const score = base + att;
    if (score !== e.score) {
      await prisma.event.update({ where: { id: e.id }, data: { score } });
      updated++;
    }
  }
  return updated;
}

export async function recomputeEventScore(prisma: {
  event: {
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
}, eventId: string) {
  const e = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { attendance: { where: { status: "GOING" } } } } },
  });
  if (!e) return;
  const base = calculateBaseScore(e);
  const att = calculateAttendanceScore(e._count.attendance);
  const score = base + att;
  if (score !== e.score) {
    await prisma.event.update({ where: { id: eventId }, data: { score } });
  }
}

export function calculatePreferenceBoost(
  event: {
    category: string;
    district: string;
    vibes: string[];
  },
  preferences: UserPreferences
): number {
  let boost = 1.0;

  if (preferences.preferredCategories.includes(event.category)) {
    boost += 0.25;
  }
  if (preferences.preferredDistricts.includes(event.district)) {
    boost += 0.15;
  }
  const vibeMatch = event.vibes.some((v) =>
    preferences.preferredVibes.includes(v)
  );
  if (vibeMatch) {
    boost += 0.25;
  }

  return boost;
}

export function calculateFinalScore(
  event: {
    startDate: Date;
    endDate: Date;
    imageUrl: string | null;
    description: string | null;
    time: string | null;
    address: string | null;
    category: string;
    district: string;
    vibes: string[];
  },
  preferences: UserPreferences
): number {
  const base = calculateBaseScore(event);
  const boost = calculatePreferenceBoost(event, preferences);
  return Math.round(base * boost);
}
