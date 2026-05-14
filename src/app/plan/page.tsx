import { getEvents } from "@/lib/events-server";
import PlanClient from "./plan-client";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const events = await getEvents({ limit: 200 });
  return <PlanClient events={events} />;
}
