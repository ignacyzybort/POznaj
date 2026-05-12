import { vibeEmoji } from "@/lib/data";

const VIBE_LABEL: Record<string, string> = {
  Randka: "Randka", Impreza: "Impreza", WyjscieZeZnajomymi: "Ze znajomymi",
  Rodzinne: "Rodzinne", Spokojne: "Spokojne", Kulturalne: "Kulturalne",
  Aktywne: "Aktywne",
};

export default function VibePill({ vibe }: { vibe: string }) {
  return (
    <span className="pz-pill" style={{ background: "var(--bg-soft)", borderColor: "transparent", fontSize: 11 }}>
      <span>{vibeEmoji[vibe] ?? ""}</span>
      {VIBE_LABEL[vibe] ?? vibe}
    </span>
  );
}
