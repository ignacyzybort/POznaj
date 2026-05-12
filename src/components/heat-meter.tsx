export default function HeatMeter({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const pct = Math.min(100, Math.max(0, score));
  let color: string, label: string;
  if (pct >= 85)      { color = "var(--hot)";     label = "Gorące"; }
  else if (pct >= 70) { color = "var(--hot-2)";   label = "Rozkręca się"; }
  else if (pct >= 50) { color = "#FFB627";        label = "Trending"; }
  else if (pct >= 30) { color = "var(--sage-2)";  label = "Świeże"; }
  else                { color = "var(--ink-4)";    label = "Nowość"; }

  const bars = 5;
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = ((pct + 11) * (i + 1) * 13) % 100;
    return 0.35 + (seed / 100) * 0.65 * (pct / 100 + 0.25);
  });

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1.5" style={{ color }}>
        <span className="inline-flex items-center gap-[2px]" style={{ height: 14 }}>
          {heights.map((h, i) => (
            <span
              key={i}
              className="w-[2.5px] rounded-full animate-pulse"
              style={{
                height: `${h * 100}%`,
                background: "currentColor",
                animation: `pz-pulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </span>
        <span className="text-[11px] font-bold tabular-nums">{pct}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-[2px]" style={{ height: 22, color }}>
        {heights.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full"
            style={{
              height: `${h * 100}%`,
              background: "currentColor",
              animation: `pz-pulse 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </span>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
      <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: "var(--ink-3)" }}>{pct}</span>
    </div>
  );
}
