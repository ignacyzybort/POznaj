"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getCsrfToken } from "@/lib/csrf";
import { SavedIcon, CheckIcon, CloseIcon } from "@/components/icons";

type AttendanceItem = {
  eventId: string;
  status: "SAVED" | "GOING" | "INTERESTED";
  timeSlots: string[];
  event: {
    id: string;
    title: string;
    placeName: string;
    startDate: string;
    time?: string;
    category: string;
    imageUrl?: string | null;
  };
};

type ListTab = "saved" | "going";

export default function ListaClient({ items }: { items: AttendanceItem[] }) {
  const [tab, setTab] = useState<ListTab>("saved");
  const [hidden, setHidden] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const visible = items.filter((a) => !hidden.includes(`${a.eventId}:${a.status}`));
  const savedCount = visible.filter((a) => a.status === "SAVED").length;
  const goingCount = visible.filter((a) => a.status === "GOING").length;
  const filtered = visible.filter((a) =>
    tab === "saved" ? a.status === "SAVED" : a.status === "GOING",
  );

  async function remove(item: AttendanceItem) {
    const key = `${item.eventId}:${item.status}`;
    setRemoving(key);
    try {
      const res = await fetch(`/api/attendance?eventId=${encodeURIComponent(item.eventId)}&status=${item.status}`, {
        method: "DELETE",
        headers: { "x-csrf-token": getCsrfToken() },
      });
      if (!res.ok) throw new Error("failed");
      setHidden((h) => [...h, key]);
    } catch {
      alert("Nie udało się usunąć. Spróbuj ponownie.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, padding: "calc(16px + var(--safe-t)) 18px 96px" }}>
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
          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
            {tab === "saved" ? <SavedIcon size={28} /> : <CheckIcon size={28} />}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Jeszcze nic</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>
            {tab === "saved" ? "Zapisuj wydarzenia, aby tu trafiły" : "Oznacz wydarzenie jako „Idę”, aby je tu zobaczyć"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((a, i) => {
            const key = `${a.eventId}:${a.status}`;
            const timeLabel = a.timeSlots.length > 0 ? a.timeSlots.join(", ") : a.event.time;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1], delay: Math.min(i, 8) * 0.05 }}
                style={{ display: "flex", alignItems: "stretch", gap: 8 }}
              >
                <Link href={`/event/${a.event.id}`} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)", textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
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
                      {timeLabel ? ` · ${timeLabel}` : ""}
                    </p>
                    <span className="pz-pill" style={{ marginTop: 4, fontSize: 10 }}>{a.event.category}</span>
                  </div>
                </Link>
                <button
                  onClick={() => remove(a)}
                  disabled={removing === key}
                  aria-label={`Usuń ${a.event.title} z listy`}
                  style={{
                    width: 44, flexShrink: 0, border: 0, borderRadius: 18,
                    background: "var(--bg-elev)", color: "var(--ink-3)",
                    boxShadow: "var(--shadow-sm)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    opacity: removing === key ? 0.5 : 1,
                  }}
                >
                  <CloseIcon size={16} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
