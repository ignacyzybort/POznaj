import { FireIcon } from "@/components/icons";

export default function StreakCard({ weeks = 0, longest = 0 }: { weeks?: number; longest?: number }) {
  const totalBars = 8;
  return (
    <div className="pz-card" style={{
      padding: 16,
      background: "linear-gradient(135deg, var(--hot-2) 0%, var(--hot) 100%)",
      color: "white", border: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "rgba(255,255,255,0.22)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <FireIcon size={24} fill />
        </div>
        <div>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="pz-num" style={{ fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{weeks}</span>
            <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>tygodnie</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: totalBars }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: 26, borderRadius: 6,
            background: i < weeks ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.22)",
          }} />
        ))}
      </div>
      <div style={{ fontSize: "var(--text-xs)", opacity: 0.9, marginTop: 8 }}>Rekord {longest} · Tydzień kończy się w niedzielę</div>
    </div>
  );
}
