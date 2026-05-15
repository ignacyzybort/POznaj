import { getEvents } from "@/lib/events-server";
import MapaClient from "./mapa-client";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const events = await getEvents({ limit: 200 });

  return (
    <div style={{ position: "absolute", inset: 0, paddingBottom: "calc(76px + var(--safe-b))" }}>
      <MapaClient events={events} />
    </div>
  );
}
