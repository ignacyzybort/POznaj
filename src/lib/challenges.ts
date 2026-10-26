import { warsawParts, warsawToUtc } from "@/lib/warsaw-time";

export interface ChallengeDef {
  key: string;
  tier: "daily" | "weekly" | "monthly";
  title: string;
  desc: string;
  icon: string;
  universal: boolean;
  maxProgress: number;
  check: (items: GoingItem[], userPrefs: { preferredCategories: string[]; preferredDistricts: string[] }, context?: ChallengeContext) => { progress: number; done: boolean };
}

export interface GoingItem {
  event: {
    id: string;
    startDate: string;
    category: string;
    district: string;
    placeName: string;
    outdoor?: boolean;
    price?: string | null;
    time?: string | null;
    vibes: string[];
  };
  status: string;
  createdAt: string;
}

export interface ChallengeContext {
  friendEventIds?: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

function dayKey(date: Date): string {
  const p = warsawParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

function weekKey(date: Date): string {
  const p = warsawParts(date);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day + diff));
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}

function monthKey(date: Date): string {
  const p = warsawParts(date);
  return `${p.year}-${pad(p.month)}`;
}

export function weekBounds(date = new Date()): { start: Date; end: Date } {
  const p = warsawParts(date);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day + diff));
  const start = warsawToUtc(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 0, 0);
  const next = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 7));
  const end = warsawToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0);
  return { start, end };
}

export function computeStreaks(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const weeks = new Set(dates.map(weekKey));
  const nowKey = weekKey(new Date());

  const shiftKey = (key: string, days: number): string => {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  };

  const previousWeek = shiftKey(nowKey, -7);
  let cursor = weeks.has(nowKey) ? nowKey : weeks.has(previousWeek) ? previousWeek : "";
  let current = 0;
  while (cursor && weeks.has(cursor)) {
    current++;
    cursor = shiftKey(cursor, -7);
  }

  let longest = 0;
  for (const key of weeks) {
    let streak = 0;
    let c = key;
    while (weeks.has(c)) {
      streak++;
      c = shiftKey(c, -7);
    }
    if (streak > longest) longest = streak;
  }

  return { current, longest: Math.max(longest, current) };
}

function isToday(item: GoingItem): boolean {
  return dayKey(new Date(item.event.startDate)) === dayKey(new Date());
}

function isThisWeek(item: GoingItem): boolean {
  return weekKey(new Date(item.event.startDate)) === weekKey(new Date());
}

function isThisMonth(item: GoingItem): boolean {
  return monthKey(new Date(item.event.startDate)) === monthKey(new Date());
}

function isFreePrice(price?: string | null): boolean {
  if (!price) return false;
  return /\b0\s*(zł|pln)?\b/i.test(price) || /wstęp wolny|bezpłat|darmow|free/i.test(price);
}

function hasNightTime(time?: string | null): boolean {
  if (!time) return false;
  const matches = time.matchAll(/(\d{1,2})[:.](\d{2})/g);
  for (const m of matches) {
    const hour = Number(m[1]);
    if (hour >= 20 || hour < 4) return true;
  }
  return false;
}

const CHALLENGE_DEFS: ChallengeDef[] = [
  {
    key: "daily-outdoor", tier: "daily", title: "Na świeżym", desc: "Wyjdź na zewnątrz — outdoor event dziś",
    icon: "leaf", universal: true, maxProgress: 1,
    check: (items) => {
      const done = items.some((a) => isToday(a) && a.event.outdoor);
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "daily-free", tier: "daily", title: "Za darmo", desc: "Darmowe wydarzenie dziś",
    icon: "ticket", universal: true, maxProgress: 1,
    check: (items) => {
      const done = items.some((a) => isToday(a) && isFreePrice(a.event.price));
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "daily-night", tier: "daily", title: "Nocny marek", desc: "Wydarzenie po 20:00 dziś",
    icon: "moon", universal: true, maxProgress: 1,
    check: (items) => {
      const done = items.some((a) => isToday(a) && hasNightTime(a.event.time));
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "weekly-3-events", tier: "weekly", title: "Bywalec", desc: "3 wydarzenia w tym tygodniu",
    icon: "party", universal: true, maxProgress: 3,
    check: (items) => {
      const count = items.filter(isThisWeek).length;
      return { progress: Math.min(count, 3), done: count >= 3 };
    },
  },
  {
    key: "weekly-2-cats", tier: "weekly", title: "Kolekcjoner", desc: "2 różne kategorie w tym tygodniu",
    icon: "palette", universal: true, maxProgress: 2,
    check: (items) => {
      const cats = new Set(items.filter(isThisWeek).map((a) => a.event.category));
      return { progress: Math.min(cats.size, 2), done: cats.size >= 2 };
    },
  },
  {
    key: "weekly-2-districts", tier: "weekly", title: "Odkrywca", desc: "2 różne dzielnice w tym tygodniu",
    icon: "compass", universal: true, maxProgress: 2,
    check: (items) => {
      const dists = new Set(items.filter(isThisWeek).map((a) => a.event.district).filter(Boolean));
      return { progress: Math.min(dists.size, 2), done: dists.size >= 2 };
    },
  },
  {
    key: "weekly-days", tier: "weekly", title: "Regularność", desc: "Wydarzenia w 3 różnych dniach tygodnia",
    icon: "calendar", universal: true, maxProgress: 3,
    check: (items) => {
      const days = new Set(items.filter(isThisWeek).map((a) => dayKey(new Date(a.event.startDate))));
      return { progress: Math.min(days.size, 3), done: days.size >= 3 };
    },
  },
  {
    key: "weekly-night", tier: "weekly", title: "Wieczorny typ", desc: "Wydarzenie po 20:00 w tym tygodniu",
    icon: "owl", universal: true, maxProgress: 1,
    check: (items) => {
      const done = items.some((a) => isThisWeek(a) && hasNightTime(a.event.time));
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "weekly-social", tier: "weekly", title: "Spotkanie", desc: "Wydarzenie, na które idzie też znajomy",
    icon: "users", universal: true, maxProgress: 1,
    check: (items, _prefs, context) => {
      const friendEvents = new Set(context?.friendEventIds ?? []);
      const done = items.some((a) => isThisWeek(a) && friendEvents.has(a.event.id));
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "monthly-10-events", tier: "monthly", title: "Mistrz miasta", desc: "10 wydarzeń w tym miesiącu",
    icon: "trophy", universal: true, maxProgress: 10,
    check: (items) => {
      const count = items.filter(isThisMonth).length;
      return { progress: Math.min(count, 10), done: count >= 10 };
    },
  },
  {
    key: "monthly-4-cats", tier: "monthly", title: "Koneser", desc: "4 różne kategorie w tym miesiącu",
    icon: "mask", universal: false, maxProgress: 4,
    check: (items) => {
      const cats = new Set(items.filter(isThisMonth).map((a) => a.event.category));
      return { progress: Math.min(cats.size, 4), done: cats.size >= 4 };
    },
  },
  {
    key: "monthly-4-districts", tier: "monthly", title: "Globtroter", desc: "4 dzielnice w tym miesiącu",
    icon: "map", universal: false, maxProgress: 4,
    check: (items) => {
      const dists = new Set(items.filter(isThisMonth).map((a) => a.event.district).filter(Boolean));
      return { progress: Math.min(dists.size, 4), done: dists.size >= 4 };
    },
  },
  {
    key: "monthly-days", tier: "monthly", title: "Maratończyk", desc: "Wydarzenia w 8 różnych dniach miesiąca",
    icon: "date", universal: false, maxProgress: 8,
    check: (items) => {
      const days = new Set(items.filter(isThisMonth).map((a) => dayKey(new Date(a.event.startDate))));
      return { progress: Math.min(days.size, 8), done: days.size >= 8 };
    },
  },
  {
    key: "monthly-outdoor", tier: "monthly", title: "Poznaniak", desc: "5 wydarzeń na świeżym powietrzu w tym miesiącu",
    icon: "tree", universal: false, maxProgress: 5,
    check: (items) => {
      const count = items.filter((a) => isThisMonth(a) && a.event.outdoor).length;
      return { progress: Math.min(count, 5), done: count >= 5 };
    },
  },
];

// Challenge progress must reflect events the user is actually going to. The
// server page passes every attendance row in, which includes independent
// SAVED rows (save ≠ attend), INTERESTED rows legacy data, and one row per
// cinema showtime — counting raw rows inflated progress and credited events
// that were only saved. Normalise in one place so all 14 criteria agree.
export function toGoingItems(items: GoingItem[]): GoingItem[] {
  const seen = new Set<string>();
  const going: GoingItem[] = [];
  for (const item of items) {
    if (item.status !== "GOING") continue;
    const key = item.event.id || `${item.event.startDate}:${item.event.placeName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    going.push(item);
  }
  return going;
}

export const CHALLENGES: ChallengeDef[] = CHALLENGE_DEFS.map((challenge) => ({
  ...challenge,
  check: (items, userPrefs, context) => challenge.check(toGoingItems(items), userPrefs, context),
}));

export function getResetDate(tier: string): Date {
  const now = new Date();
  if (tier === "daily") {
    const { year, month, day } = warsawParts(now);
    return new Date(warsawToUtc(year, month, day + 1, 0, 0).getTime() - 1);
  }
  if (tier === "weekly") {
    const { end } = weekBounds(now);
    return new Date(end.getTime() - 1);
  }
  const { year, month } = warsawParts(now);
  return new Date(warsawToUtc(year, month + 1, 1, 0, 0).getTime() - 1);
}
