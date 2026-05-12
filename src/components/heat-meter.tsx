export default function HeatMeter({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const clamped = Math.min(100, Math.max(0, score));
  const bars = 5;

  const getColor = (i: number) => {
    const threshold = ((i + 1) / bars) * 100;
    if (clamped >= threshold * 0.9) {
      if (clamped >= 80) return "var(--hot)";
      if (clamped >= 60) return "var(--hot-2)";
      if (clamped >= 40) return "#E8B000";
      if (clamped >= 20) return "var(--sage)";
      return "var(--ink-4)";
    }
    return "var(--ink-5)";
  };

  const height = size === "md" ? 18 : 14;

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="inline-flex items-center gap-[2.5px]"
        style={{ height }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const active = clamped >= ((i + 1) / bars) * 100 - 10;
          const h = size === "md" ? [6, 10, 14, 18, 18] : [5, 8, 11, 14, 14];
          const delay = i * 0.08;
          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: size === "md" ? 3.5 : 2.5,
                height: active ? h[i] : 3,
                background: getColor(i),
                opacity: active ? 1 : 0.3,
                animation: active ? `pz-pulse 1.4s ease-in-out infinite` : "none",
                animationDelay: `${delay}s`,
                transition: "all 0.3s ease",
              }}
            />
          );
        })}
      </div>
      {size === "md" && (
        <span className="text-sm font-semibold" style={{ color: "var(--ink-3)" }}>
          {clamped}
        </span>
      )}
    </div>
  );
}
