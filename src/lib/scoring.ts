import { differenceInDays } from "date-fns";

export interface UserPreferences {
  preferredCategories: string[];
  preferredDistricts: string[];
  preferredVibes: string[];
}

export function calculateBaseScore(event: {
  startDate: Date;
  endDate: Date;
  imageUrl: string | null;
  description: string | null;
  time: string | null;
  address: string | null;
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
