const COLORS = ["#FF6B2C", "#6E3DFF", "#FF3D7F", "#2860FF", "#C8FF2E", "#E89A6B", "#FFB627"];

export default function AvStack({
  people,
  max = 3,
  size = 22,
}: {
  people?: { name: string }[];
  max?: number;
  size?: number;
}) {
  if (!people || people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <span
          key={i}
          className="rounded-full inline-flex items-center justify-center font-bold text-white shrink-0"
          style={{
            width: size,
            height: size,
            background: COLORS[i % COLORS.length],
            marginLeft: i === 0 ? 0 : -8,
            fontSize: size * 0.45,
            border: "1.5px solid var(--bg-elev)",
          }}
        >
          {p.name[0]?.toUpperCase() ?? "?"}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="rounded-full inline-flex items-center justify-center shrink-0"
          style={{
            width: size,
            height: size,
            background: "var(--bg-soft)",
            color: "var(--ink-2)",
            fontSize: size * 0.42,
            border: "1.5px solid var(--bg-elev)",
            marginLeft: -8,
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
