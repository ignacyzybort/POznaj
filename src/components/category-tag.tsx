import { categoryColors } from "@/lib/data";

const CATEGORY_LABEL: Record<string, string> = {
  Kino: "Kino", Muzyka: "Muzyka", Sztuka: "Sztuka", Sport: "Sport",
  Teatr: "Teatr", Warsztaty: "Warsztaty", Konferencje: "Konferencje",
  Jedzenie: "Jedzenie", Inne: "Inne",
};

export default function CategoryTag({ cat, size = "sm" }: { cat: string; size?: "sm" | "md" }) {
  const tone = categoryColors[cat] ?? categoryColors.Inne;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: tone.bg, color: tone.fg,
      padding: size === "sm" ? "3px 8px" : "5px 11px",
      borderRadius: 999, fontSize: size === "sm" ? 11 : 12,
      fontWeight: 700, letterSpacing: "-0.005em",
    }}>
      {CATEGORY_LABEL[cat] ?? cat}
    </span>
  );
}
