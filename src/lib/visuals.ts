export const categoryVisual: Record<
  string,
  { emoji: string; gradient: string; label: string }
> = {
  Kino: { emoji: "🎬", gradient: "from-violet-500 to-purple-600", label: "Kino" },
  Muzyka: { emoji: "🎵", gradient: "from-pink-500 to-rose-600", label: "Muzyka" },
  Sztuka: { emoji: "🎨", gradient: "from-indigo-500 to-violet-600", label: "Sztuka" },
  Sport: { emoji: "⚡", gradient: "from-emerald-500 to-teal-600", label: "Sport" },
  Teatr: { emoji: "🎭", gradient: "from-amber-500 to-orange-600", label: "Teatr" },
  Warsztaty: { emoji: "🔧", gradient: "from-cyan-500 to-blue-600", label: "Warsztaty" },
  Konferencje: { emoji: "💼", gradient: "from-sky-500 to-blue-600", label: "Konferencje" },
  Jedzenie: { emoji: "🍕", gradient: "from-orange-500 to-red-500", label: "Jedzenie" },
  Inne: { emoji: "📌", gradient: "from-zinc-500 to-neutral-600", label: "Inne" },
};

export const vibeColors: Record<string, string> = {
  Randka: "bg-pink-100 text-pink-700 border-pink-200",
  Impreza: "bg-purple-100 text-purple-700 border-purple-200",
  WyjscieZeZnajomymi: "bg-teal-100 text-teal-700 border-teal-200",
  Rodzinne: "bg-green-100 text-green-700 border-green-200",
  Spokojne: "bg-sky-100 text-sky-700 border-sky-200",
  Kulturalne: "bg-amber-100 text-amber-700 border-amber-200",
  Aktywne: "bg-orange-100 text-orange-700 border-orange-200",
};

export const vibeIcons: Record<string, string> = {
  Randka: "💕",
  Impreza: "🥳",
  WyjscieZeZnajomymi: "👥",
  Rodzinne: "👨‍👩‍👧‍👦",
  Spokojne: "🧘",
  Kulturalne: "🎭",
  Aktywne: "🏃",
};

export const categoryColors: Record<string, string> = {
  Muzyka: "bg-pink-100 text-pink-700 border-pink-200",
  Kino: "bg-violet-100 text-violet-700 border-violet-200",
  Sztuka: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Sport: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Teatr: "bg-amber-100 text-amber-700 border-amber-200",
  Warsztaty: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Konferencje: "bg-blue-100 text-blue-700 border-blue-200",
  Jedzenie: "bg-orange-100 text-orange-700 border-orange-200",
  Inne: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function categoryGradient(category: string | undefined): string {
  return "linear-gradient(180deg, transparent 40%, rgba(20,19,15,0.85) 100%)";
}
