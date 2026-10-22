import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ListaClient from "./lista-client";

export default async function ListaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, padding: "calc(16px + var(--safe-t)) 18px 96px" }}>
        <div style={{ marginBottom: 24 }}>
          <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </span>
        </div>
        <div style={{ padding: 32, borderRadius: 22, background: "var(--bg-soft)", textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: "var(--ink-3)" }}>
            Zaloguj się, aby zapisywać wydarzenia
          </p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 44, padding: "0 24px", borderRadius: 28, fontSize: 15, fontWeight: 600, background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}>Zaloguj się</Link>
        </div>
      </div>
    );
  }

  const attendance = await prisma.attendance.findMany({
    where: { userId: session.user.id, event: { endDate: { gte: new Date() } } },
    select: {
      status: true,
      timeSlot: true,
      event: {
        select: {
          id: true,
          title: true,
          placeName: true,
          startDate: true,
          time: true,
          category: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<string, {
    eventId: string;
    status: "SAVED" | "GOING" | "INTERESTED";
    timeSlots: string[];
    event: { id: string; title: string; placeName: string; startDate: string; time?: string; category: string; imageUrl?: string | null };
  }>();

  for (const a of attendance) {
    const key = `${a.event.id}:${a.status}`;
    const item = grouped.get(key) ?? {
      eventId: a.event.id,
      status: a.status,
      timeSlots: [],
      event: {
        id: a.event.id,
        title: a.event.title,
        placeName: a.event.placeName,
        startDate: a.event.startDate.toISOString(),
        time: a.event.time ?? undefined,
        category: a.event.category,
        imageUrl: a.event.imageUrl,
      },
    };
    if (a.timeSlot && !item.timeSlots.includes(a.timeSlot)) item.timeSlots.push(a.timeSlot);
    grouped.set(key, item);
  }

  const items = Array.from(grouped.values()).sort((a, b) => a.event.startDate.localeCompare(b.event.startDate));

  return <ListaClient items={items} />;
}
