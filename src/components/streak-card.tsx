export default function StreakCard({ weeks = 0, longest = 0 }: { weeks?: number; longest?: number }) {
  const totalBars = 8;
  return (
    <div className="pz-card" style={{
      padding: 16,
      background: "linear-gradient(135deg, #FF6B2C 0%, #FF3D7F 100%)",
      color: "white", border: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(10px)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2c.7 3.4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 0-8z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>Streak</div>
          <div className="pz-h pz-num" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{weeks} tygodnie</div>
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
      <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 8 }}>Rekord {longest} · Tydzień kończy się w niedzielę</div>
    </div>
  );
}
