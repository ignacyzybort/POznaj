import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ListaClient from "./lista-client";

export default async function ListaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, padding: "calc(16px + var(--safe-t)) 0 96px" }}>
        <div className="pz-page" style={{ padding: "0 18px" }}>
        <div style={{ marginBottom: 20 }}>
          <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
            poznaj<span style={{ color: "var(--sage)" }}>.</span>
          </span>
        </div>
        <div className="pz-eyebrow" style={{ marginBottom: 6 }}>Twoja lista</div>
        <h1 className="pz-display" style={{ margin: "0 0 20px", fontSize: "var(--text-3xl)", fontWeight: 400, letterSpacing: "-0.035em" }}>
          Zapisane.
        </h1>
        <div style={{ maxWidth: 480, margin: "clamp(20px, 6vh, 56px) auto 0", textAlign: "center" }}>
          <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--ink-3)", margin: "0 auto 24px", maxWidth: 340 }}>
            Zaloguj się, aby zapisywać wydarzenia i wracać do nich, kiedy będziesz gotowy.
          </p>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 50, padding: "0 30px", borderRadius: 99, fontSize: "var(--text-base)", fontWeight: 600, background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}>Zaloguj się</Link>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line-2)" }}>
            <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none" }}>Zobacz wydarzenia →</Link>
          </div>
        </div>
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
