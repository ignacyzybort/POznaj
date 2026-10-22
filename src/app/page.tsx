import { getEvents } from "@/lib/events-server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  const [events, total] = await Promise.all([
    getEvents({ limit: 50, sort: "score" }),
    prisma.event.count({ where: { endDate: { gte: new Date() } } }),
  ]);

  const ids = events.map((e) => e.id);
  let initialSavedIds: string[] = [];
  let initialSavedSlots: Record<string, string[]> = {};

  if (session?.user?.id && ids.length > 0) {
    const rows = await prisma.attendance.findMany({
      where: { userId: session.user.id, eventId: { in: ids }, status: "SAVED" },
      select: { eventId: true, timeSlot: true },
    });

    initialSavedIds = Array.from(new Set(rows.map((r) => r.eventId)));
    initialSavedSlots = rows.reduce<Record<string, string[]>>((acc, row) => {
      if (!row.timeSlot) return acc;
      acc[row.eventId] = [...(acc[row.eventId] ?? []), row.timeSlot];
      return acc;
    }, {});
  }

  return (
    <HomeClient
      initialEvents={events}
      initialTotal={total}
      initialSavedIds={initialSavedIds}
      initialSavedSlots={initialSavedSlots}
    />
  );
}
