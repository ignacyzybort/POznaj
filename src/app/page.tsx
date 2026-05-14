import { getEvents } from "@/lib/events-server";
import { prisma } from "@/lib/prisma";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, total] = await Promise.all([
    getEvents({ limit: 200, sort: "score" }),
    prisma.event.count({ where: { endDate: { gte: new Date() } } }),
  ]);

  return <HomeClient initialEvents={events} initialTotal={total} />;
}
