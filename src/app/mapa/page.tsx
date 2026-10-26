import { getMapEvents } from "@/lib/events-server";
import { PL_DAY_FULL, fmtFullDate } from "@/lib/date";
import MapaClient from "./mapa-client";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const events = await getMapEvents();
  const today = new Date();

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", paddingBottom: "calc(76px + var(--safe-b))" }}>
      {/* Masthead lives in flow; the map pane fills the rest */}
      <div style={{ flexShrink: 0, padding: "calc(14px + var(--safe-t)) 0 8px" }}>
        <div className="pz-page" style={{ padding: "0 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
              poznaj<span style={{ color: "var(--sage)" }}>.</span>
            </span>
            <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>
              Mapa · {PL_DAY_FULL[today.getDay()]}, {fmtFullDate(today)}
            </span>
          </div>
          <h1 className="pz-display" style={{ margin: 0, fontSize: "clamp(30px, 6vw, 46px)", fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 0.95 }}>
            Dzielnice <em>Poznania.</em>
          </h1>
        </div>
      </div>
      <MapaClient events={events} />
    </div>
  );
}
