interface Challenge {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (goingItems: any[]) => { done: boolean; progress: number; max: number };
}

const thisMonth = () => {
  const now = new Date();
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
};

export const CHALLENGES: Challenge[] = [
  {
    id: "social",
    title: "Bywalec",
    desc: "Idź na 3 wydarzenia w tym miesiącu",
    icon: "🎉",
    check: (items) => {
      const { start, end } = thisMonth();
      const count = items.filter((a: any) => {
        const d = new Date(a.event?.startDate ?? a.startDate);
        return d >= start && d <= end;
      }).length;
      return { done: count >= 3, progress: Math.min(count, 3), max: 3 };
    },
  },
  {
    id: "explorer",
    title: "Odkrywca",
    desc: "Odwiedź wydarzenia w 2 różnych dzielnicach",
    icon: "🧭",
    check: (items) => {
      const districts = new Set(items.map((a: any) => a.event?.district).filter(Boolean));
      return { done: districts.size >= 2, progress: districts.size, max: 2 };
    },
  },
  {
    id: "variety",
    title: "Różnorodność",
    desc: "Wypróbuj 2 różne kategorie",
    icon: "🎨",
    check: (items) => {
      const cats = new Set(items.map((a: any) => a.event?.category).filter(Boolean));
      return { done: cats.size >= 2, progress: cats.size, max: 2 };
    },
  },
  {
    id: "weekend",
    title: "Weekendowicz",
    desc: "Idź na wydarzenie w weekend",
    icon: "🌙",
    check: (items) => {
      const hasWeekend = items.some((a: any) => {
        const d = new Date(a.event?.startDate ?? a.startDate);
        return d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0;
      });
      return { done: hasWeekend, progress: hasWeekend ? 1 : 0, max: 1 };
    },
  },
];

export function computeChallenges(goingItems: any[]) {
  return CHALLENGES.map((c) => {
    const result = c.check(goingItems);
    return { ...c, ...result };
  });
}
