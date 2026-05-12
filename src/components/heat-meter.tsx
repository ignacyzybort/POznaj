export default function HeatMeter({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const clamped = Math.min(100, Math.max(0, score));
  const pct = clamped;

  let color: string;
  let label: string;
  let emoji: string;

  if (pct >= 80) {
    color = "bg-red-500";
    label = "Gorące";
    emoji = "🔥🔥";
  } else if (pct >= 60) {
    color = "bg-orange-500";
    label = "Bardzo popularne";
    emoji = "🔥";
  } else if (pct >= 40) {
    color = "bg-amber-500";
    label = "Popularne";
    emoji = "⚡";
  } else if (pct >= 20) {
    color = "bg-yellow-500";
    label = "Ciekawe";
    emoji = "📈";
  } else {
    color = "bg-zinc-300";
    label = "Nowość";
    emoji = "🌟";
  }

  if (size === "sm") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs">{emoji}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-zinc-500 w-12 text-right">{pct}</span>
    </div>
  );
}
