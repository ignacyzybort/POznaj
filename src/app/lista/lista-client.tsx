"use client";

import { useState } from "react";
import Link from "next/link";

type AttendanceItem = {
  id: string;
  status: "SAVED" | "GOING" | "INTERESTED";
  event: {
    id: string;
    title: string;
    placeName: string;
    startDate: string;
    category: string;
    imageUrl?: string | null;
  };
};

type ListTab = "saved" | "going";

export default function ListaClient({ items }: { items: AttendanceItem[] }) {
  const [tab, setTab] = useState<ListTab>("saved");

  const savedCount = items.filter((a) => a.status === "SAVED").length;
  const goingCount = items.filter((a) => a.status === "GOING").length;
  const filtered = items.filter((a) =>
    tab === "saved" ? a.status === "SAVED" : a.status === "GOING",
  );

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, padding: "calc(54px + var(--safe-t)) 18px 96px" }}>
      <div className="pz-eyebrow" style={{ marginBottom: 6 }}>Twoja lista</div>
      <h1 className="pz-h" style={{ margin: "0 0 20px", fontSize: "var(--text-3xl)", fontWeight: 700, letterSpacing: "-0.035em" }}>
        {tab === "saved" ? "Zapisane." : "Idziesz."}
      </h1>

      <div className="pz-seg" style={{ marginBottom: 24 }}>
        <button onClick={() => setTab("saved")} data-active={tab === "saved"}>
          Zapisane ({savedCount})
        </button>
        <button onClick={() => setTab("going")} data-active={tab === "going"}>
          Idę ({goingCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-4)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{tab === "saved" ? "🏷️" : "🎯"}</div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Jeszcze nic</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Zapisuj wydarzenia, aby tu trafiły</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((a) => (
            <Link key={a.id} href={`/event/${a.event.id}`} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0, background: "var(--bg-soft)" }}>
                {a.event.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={a.event.imageUrl} alt={a.event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.event.title}
                </p>
                <p style={{ fontSize: 12, marginTop: 2, color: "var(--ink-3)" }}>
                  {a.event.placeName} · {new Date(a.event.startDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                </p>
                <span className="pz-pill" style={{ marginTop: 4, fontSize: 10 }}>{a.event.category}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
