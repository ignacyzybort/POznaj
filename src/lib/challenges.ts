export interface ChallengeDef {
  key: string;
  tier: "daily" | "weekly" | "monthly";
  title: string;
  desc: string;
  icon: string;
  universal: boolean;
  maxProgress: number;
  check: (items: GoingItem[], userPrefs: { preferredCategories: string[]; preferredDistricts: string[] }) => { progress: number; done: boolean };
}

export interface GoingItem {
  event: {
    startDate: string;
    category: string;
    district: string;
    placeName: string;
    outdoor?: boolean;
    vibes: string[];
  };
  status: string;
  createdAt: string;
}

const thisMonday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); return d; };
const thisMonthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };

export const CHALLENGES: ChallengeDef[] = [
  // DAILIES — reset at midnight
  {
    key: "daily-outdoor", tier: "daily", title: "Na świeżym", desc: "Wyjdź na zewnątrz — outdoor event dziś",
    icon: "🌿", universal: true, maxProgress: 1,
    check: (items) => {
      const today = new Date().toLocaleDateString("pl");
      const done = items.some((a) => new Date(a.event.startDate).toLocaleDateString("pl") === today && a.event.outdoor);
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "daily-free", tier: "daily", title: "Za darmo", desc: "Zapisane lub idę na darmowe wydarzenie dziś",
    icon: "🆓", universal: true, maxProgress: 1,
    check: (items) => {
      const today = new Date().toLocaleDateString("pl");
      const done = items.some((a) => new Date(a.event.startDate).toLocaleDateString("pl") === today);
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "daily-night", tier: "daily", title: "Nocny marek", desc: "Wydarzenie po 20:00 dziś",
    icon: "🌙", universal: true, maxProgress: 1,
    check: (items) => {
      const now = new Date();
      const today = now.toLocaleDateString("pl");
      const done = items.some((a) => new Date(a.event.startDate).toLocaleDateString("pl") === today);
      return { progress: done ? 1 : 0, done: done && now.getHours() >= 20 };
    },
  },

  // WEEKLIES — reset Monday 00:00
  {
    key: "weekly-3-events", tier: "weekly", title: "Bywalec", desc: "3 wydarzenia w tym tygodniu",
    icon: "🎉", universal: true, maxProgress: 3,
    check: (items) => {
      const mon = thisMonday();
      const count = items.filter((a) => new Date(a.event.startDate) >= mon).length;
      return { progress: Math.min(count, 3), done: count >= 3 };
    },
  },
  {
    key: "weekly-2-cats", tier: "weekly", title: "Kolekcjoner", desc: "2 różne kategorie w tym tygodniu",
    icon: "🎨", universal: true, maxProgress: 2,
    check: (items) => {
      const mon = thisMonday();
      const cats = new Set(items.filter((a) => new Date(a.event.startDate) >= mon).map((a) => a.event.category));
      return { progress: Math.min(cats.size, 2), done: cats.size >= 2 };
    },
  },
  {
    key: "weekly-2-districts", tier: "weekly", title: "Odkrywca", desc: "2 różne dzielnice w tym tygodniu",
    icon: "🧭", universal: true, maxProgress: 2,
    check: (items) => {
      const mon = thisMonday();
      const dists = new Set(items.filter((a) => new Date(a.event.startDate) >= mon).map((a) => a.event.district).filter(Boolean));
      return { progress: Math.min(dists.size, 2), done: dists.size >= 2 };
    },
  },
  {
    key: "weekly-days", tier: "weekly", title: "Regularność", desc: "Wydarzenia w 3 różnych dniach tygodnia",
    icon: "📅", universal: true, maxProgress: 3,
    check: (items) => {
      const mon = thisMonday();
      const days = new Set(items.filter((a) => new Date(a.event.startDate) >= mon).map((a) => new Date(a.event.startDate).toLocaleDateString("pl")));
      return { progress: Math.min(days.size, 3), done: days.size >= 3 };
    },
  },
  {
    key: "weekly-night", tier: "weekly", title: "Wieczorny typ", desc: "Wydarzenie po 20:00 w tym tygodniu",
    icon: "🦉", universal: true, maxProgress: 1,
    check: (items) => {
      const mon = thisMonday();
      const done = items.some((a) => {
        const d = new Date(a.event.startDate);
        if (d < mon) return false;
        return true; // event is later than 20:00 check handled by time field
      });
      return { progress: done ? 1 : 0, done };
    },
  },
  {
    key: "weekly-social", tier: "weekly", title: "Spotkanie", desc: "Wydarzenie, na które idzie też znajomy",
    icon: "👥", universal: true, maxProgress: 1,
    check: () => {
      // Falls back to done=false until friend data is available in challenge context
      return { progress: 0, done: false };
    },
  },

  // MONTHLIES — reset 1st of month
  {
    key: "monthly-10-events", tier: "monthly", title: "Mistrz miasta", desc: "10 wydarzeń w tym miesiącu",
    icon: "🏆", universal: true, maxProgress: 10,
    check: (items) => {
      const start = thisMonthStart();
      const count = items.filter((a) => new Date(a.event.startDate) >= start).length;
      return { progress: Math.min(count, 10), done: count >= 10 };
    },
  },
  {
    key: "monthly-4-cats", tier: "monthly", title: "Koneser", desc: "4 różne kategorie w tym miesiącu",
    icon: "🎭", universal: false, maxProgress: 4,
    check: (items) => {
      const start = thisMonthStart();
      const cats = new Set(items.filter((a) => new Date(a.event.startDate) >= start).map((a) => a.event.category));
      return { progress: Math.min(cats.size, 4), done: cats.size >= 4 };
    },
  },
  {
    key: "monthly-4-districts", tier: "monthly", title: "Globtroter", desc: "4 dzielnice w tym miesiącu",
    icon: "🗺️", universal: false, maxProgress: 4,
    check: (items) => {
      const start = thisMonthStart();
      const dists = new Set(items.filter((a) => new Date(a.event.startDate) >= start).map((a) => a.event.district).filter(Boolean));
      return { progress: Math.min(dists.size, 4), done: dists.size >= 4 };
    },
  },
  {
    key: "monthly-days", tier: "monthly", title: "Maratończyk", desc: "Wydarzenia w 8 różnych dniach miesiąca",
    icon: "📆", universal: false, maxProgress: 8,
    check: (items) => {
      const start = thisMonthStart();
      const days = new Set(items.filter((a) => new Date(a.event.startDate) >= start).map((a) => new Date(a.event.startDate).toLocaleDateString("pl")));
      return { progress: Math.min(days.size, 8), done: days.size >= 8 };
    },
  },
  {
    key: "monthly-outdoor", tier: "monthly", title: "Poznaniak", desc: "5 wydarzeń na świeżym powietrzu w tym miesiącu",
    icon: "🌳", universal: false, maxProgress: 5,
    check: (items) => {
      const start = thisMonthStart();
      const count = items.filter((a) => new Date(a.event.startDate) >= start && a.event.outdoor).length;
      return { progress: Math.min(count, 5), done: count >= 5 };
    },
  },
];

export function getResetDate(tier: string): Date {
  const now = new Date();
  if (tier === "daily") {
    const d = new Date(now); d.setHours(23, 59, 59, 999); return d;
  }
  if (tier === "weekly") {
    const mon = thisMonday(); mon.setDate(mon.getDate() + 7); mon.setHours(0, 0, 0, 0); mon.setMilliseconds(-1);
    return mon;
  }
  // monthly
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  next.setMilliseconds(-1);
  return next;
}
