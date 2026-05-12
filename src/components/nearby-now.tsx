import { PZ_NEARBY_NOW } from "@/lib/mock-extras";

export default function NearbyNow() {
  return (
    <div style={{ padding: "0 16px 22px" }}>
      <div style={{
        display: "flex", alignItems: "baseline",
        justifyContent: "space-between", marginBottom: 10,
      }}>
        <h2 className="pz-h" style={{
          margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em",
        }}>Blisko Ciebie · teraz</h2>
        <span className="pz-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 99,
            background: "#2EC36B", boxShadow: "0 0 6px #2EC36B",
            animation: "pz-pulse 1.6s infinite",
          }} />
          Live
        </span>
      </div>
      <div className="pz-scroll" style={{
        display: "flex", gap: 10, overflowX: "auto",
        paddingBottom: 4, marginRight: -16,
      }}>
        {PZ_NEARBY_NOW.map((n, i) => (
          <div key={i} className="pz-card" style={{
            flexShrink: 0, padding: 14, minWidth: 200,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 99,
              background: n.color, color: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, flexShrink: 0,
              position: "relative",
            }}>
              {n.name[0]}
              <span style={{
                position: "absolute", right: -1, bottom: -1,
                width: 12, height: 12, borderRadius: 99,
                background: "#2EC36B", border: "2px solid var(--bg-elev)",
              }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{n.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{n.where} · {n.mins} min stąd</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
