import { PZ_TRENDING_VENUES } from "@/lib/mock-extras";

export default function TrendingRail() {
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 92,
      padding: "0 14px",
    }}>
      <div style={{
        background: "var(--bg-elev)", borderRadius: 22,
        padding: "12px 14px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
        border: "0.5px solid var(--line)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "baseline", marginBottom: 8,
        }}>
          <div className="pz-eyebrow">Najgorętsze miejsca · teraz</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", fontWeight: 600 }}>ostatnie 24h</div>
        </div>
        <div className="pz-scroll" style={{
          display: "flex", gap: 10, overflowX: "auto",
          margin: "0 -6px", padding: "0 6px",
        }}>
          {PZ_TRENDING_VENUES.slice(0, 6).map((v, i) => (
            <div key={i} style={{
              flex: "0 0 auto", padding: "8px 12px", borderRadius: 12,
              background: "var(--bg-soft)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span className="pz-num" style={{
                fontSize: 14, fontWeight: 800, color: "var(--hot)",
              }}>{i + 1}</span>
              <div>
                <div style={{
                  fontSize: 12.5, fontWeight: 700,
                  letterSpacing: "-0.01em", lineHeight: 1.1,
                }}>{v.name}</div>
                <div style={{
                  fontSize: 10, color: "var(--ink-4)", marginTop: 2, fontWeight: 600,
                }}>{v.count.toLocaleString("pl-PL")} osób</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
