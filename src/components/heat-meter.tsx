export default function HeatMeter({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const pct = Math.min(100, Math.max(0, score));
  let color: string, label: string;
  if (pct >= 85)      { color = "var(--hot)";     label = "Gorące"; }
  else if (pct >= 70) { color = "var(--hot-2)";   label = "Rozkręca się"; }
  else if (pct >= 50) { color = "var(--c-jedzenie)"; label = "Trending"; }
  else if (pct >= 30) { color = "var(--sage-2)";  label = "Świeże"; }
  else                { color = "var(--ink-4)";    label = "Nowość"; }

  const bars = 5;
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = ((pct + 11) * (i + 1) * 13) % 100;
    return 0.35 + (seed / 100) * 0.65 * (pct / 100 + 0.25);
  });

  if (size === "sm") {
    return (
      <span className="pz-heat" style={{ color }}>
        <span className="pz-heat-wave" aria-hidden>
          {heights.map((h, i) => (
            <span key={i} className="pz-heat-bar"
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }}/>
          ))}
        </span>
        <span className="pz-num" style={{ fontSize: 11, fontWeight: 700 }}>{pct}</span>
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="pz-heat" style={{ color }}>
        <span className="pz-heat-wave" style={{ height: 22 }} aria-hidden>
          {heights.map((h, i) => (
            <span key={i} className="pz-heat-bar"
                  style={{ width: 3, height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }}/>
          ))}
        </span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
      <span className="pz-num" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--ink-3)" }}>{pct}</span>
    </div>
  );
}
