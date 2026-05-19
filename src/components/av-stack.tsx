const COLORS = [
  "var(--c-teatr)", "var(--c-kino)", "var(--c-muzyka)", "var(--c-sztuka)", "var(--c-sport)", "var(--c-warsztaty)", "var(--c-jedzenie)"
];

export default function AvStack({ people, max = 3, size = 22 }: { people?: { name: string }[]; max?: number; size?: number }) {
  if (!people || people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <span className="pz-avstack">
      {shown.map((p, i) => (
        <span key={i} className="pz-av"
              style={{ width: size, height: size, background: COLORS[i % COLORS.length], fontSize: size * 0.45 }}>
          {p.name[0]?.toUpperCase() ?? "?"}
        </span>
      ))}
      {extra > 0 && (
        <span className="pz-av"
              style={{ width: size, height: size, background: "var(--bg-soft)", color: "var(--ink-2)", fontSize: size * 0.42 }}>
          +{extra}
        </span>
      )}
    </span>
  );
}
