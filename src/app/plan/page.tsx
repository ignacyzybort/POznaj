import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEvents } from "@/lib/events-server";
import type { EventData } from "@/lib/data";
import PlanClient from "./plan-client";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await auth();
  let events: EventData[] = [];
  let personal = false;

  if (session?.user?.id) {
    personal = true;
    const rows = await prisma.attendance.findMany({
      where: { userId: session.user.id, event: { endDate: { gte: new Date() } } },
      include: { event: { include: { vibes: { select: { vibe: true } } } } },
    });

    const seen = new Set<string>();
    events = [];
    for (const row of rows) {
      if (seen.has(row.eventId)) continue;
      seen.add(row.eventId);
      const e = row.event;
      events.push({
        id: e.id,
        title: e.title,
        description: e.description ?? undefined,
        imageUrl: e.imageUrl ?? undefined,
        sourceUrl: e.sourceUrl,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        time: e.time ?? undefined,
        placeName: e.placeName,
        address: e.address ?? undefined,
        district: e.district,
        category: e.category,
        vibes: e.vibes.map((v) => v.vibe),
        source: e.source,
        score: e.score,
        price: e.price ?? undefined,
        outdoor: e.outdoor,
        coordsX: e.coordsX ?? undefined,
        coordsY: e.coordsY ?? undefined,
      });
    }
  } else {
    events = await getEvents({ limit: 200 });
  }

  return <PlanClient events={events} personal={personal} />;
}
