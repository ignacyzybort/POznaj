import { getEvents } from "@/lib/events-server";
import { PL_DAY_FULL, fmtFullDate } from "@/lib/date";
import MapaClient from "./mapa-client";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const events = await getEvents({ limit: 200 });
  const today = new Date();

  return (
    <div style={{ position: "absolute", inset: 0, paddingBottom: "calc(76px + var(--safe-b))" }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "calc(16px + var(--safe-t)) 18px 10px",
        zIndex: 1000, pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
          <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </span>
          <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>
            {PL_DAY_FULL[today.getDay()]}, {fmtFullDate(today)}
          </span>
        </div>
        <h1 className="pz-h" style={{ margin: 0, fontSize: 36, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 0.95, color: "var(--ink)" }}>
          Dzielnice Poznania.
        </h1>
      </div>
      <MapaClient events={events} />
    </div>
  );
}
