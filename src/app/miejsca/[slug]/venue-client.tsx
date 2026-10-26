"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard from "@/components/event-card";
import { BackIcon, PinIcon } from "@/components/icons";
import type { EventData } from "@/lib/data";

export default function VenueClient({
  label, events, districts, categories,
}: {
  label: string;
  events: EventData[];
  districts: string[];
  categories: string[];
}) {
  const router = useRouter();
  const goingTotal = events.reduce((sum, e) => sum + (e.going ?? 0), 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh", paddingBottom: 120 }}>
      <div style={{ padding: "calc(14px + var(--safe-t)) 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" aria-label="Wróć" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <BackIcon size={20} />
        </Link>
      </div>

      <div style={{ padding: "0 18px" }}>
        <div style={{ marginTop: 20, marginBottom: 8 }}>
          <h1 className="pz-display" style={{ margin: 0, fontSize: "clamp(28px, 7vw, 36px)", fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.02 }}>
            {label}
          </h1>
        </div>

        {events.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {districts.map((d) => <span key={d} className="pz-chip" style={{ fontSize: 12 }}><PinIcon size={12} /> {d}</span>)}
            <span className="pz-chip" style={{ fontSize: 12 }}>{categories.join(" · ")}</span>
          </div>
        )}

        <div className="pz-eyebrow" style={{ marginBottom: 20 }}>
          {events.length > 0
            ? `${events.length} ${events.length === 1 ? "nadchodzące wydarzenie" : events.length < 5 ? "nadchodzące wydarzenia" : "nadchodzących wydarzeń"}${goingTotal > 0 ? ` · ${goingTotal} ${goingTotal === 1 ? "osoba idzie" : goingTotal < 5 ? "osoby idą" : "osób idzie"}` : ""}`
            : "Brak nadchodzących wydarzeń"}
        </div>
      </div>

      {events.length > 0 ? (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((e) => <EventCard key={e.id} event={e} onOpen={() => router.push(`/event/${e.id}`)} />)}
        </div>
      ) : (
        <div style={{ padding: "0 18px", textAlign: "center", color: "var(--ink-3)", marginTop: 80 }}>
          <p className="pz-display" style={{ fontSize: "clamp(20px, 4.5vw, 24px)", margin: "0 0 8px" }}>Jeszcze nic</p>
          <p>Sprawdź później — na razie brak wydarzeń w tym miejscu.</p>
        </div>
      )}
    </div>
  );
}
