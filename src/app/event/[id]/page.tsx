"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventData, categoryColors, categoryEmoji, vibeEmoji } from "@/lib/data";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import HeatMeter from "@/components/heat-meter";

function fmtDate(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isSameDay(s, e)) return format(s, "d MMMM yyyy", { locale: pl });
  return `${format(s, "d", { locale: pl })}–${format(e, "d MMMM yyyy", { locale: pl })}`;
}

function relativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Dziś";
  if (diff === 1) return "Jutro";
  if (diff < 0) return `${Math.abs(diff)} dni temu`;
  return `Za ${diff} dni`;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [saved, setSaved] = useState(false);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${params.id}`).then((r) => r.json()).then((d) => {
      if (d.event) setEvent(d.event);
    });
  }, [params.id]);

  if (!event) {
    return (
      <div className="p-10 text-center" style={{ color: "var(--ink-4)" }}>
        <div className="text-4xl mb-3">😕</div>
        <p className="font-bold">Nie znaleziono</p>
        <button onClick={() => router.back()} className="text-sm mt-2 underline cursor-pointer">Wróć</button>
      </div>
    );
  }

  const catStyle = categoryColors[event.category] ?? { bg: "#E8E3D8", fg: "#1A1A1A" };

  return (
    <div className="absolute inset-0 z-30 bg-[var(--bg)] overflow-y-auto" style={{ paddingBottom: 100 }}>
      <div className="relative h-72 sm:h-80 overflow-hidden bg-[var(--bg-soft)]">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: "var(--bg-soft)" }}>
            {categoryEmoji[event.category] ?? "📌"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer backdrop-blur-md text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.7)" }}
          >
            ←
          </button>
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full flex items-center justify-center border-0 cursor-pointer backdrop-blur-md text-sm font-bold no-underline"
            style={{ background: "rgba(255,255,255,0.7)", color: "var(--ink)" }}
          >
            ↗
          </a>
        </div>
      </div>

      <div className="px-5 -mt-8 relative space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
            style={{ background: catStyle.bg, color: catStyle.fg }}
          >
            {categoryEmoji[event.category]} {event.category}
          </span>
          {event.vibes?.map((v: string) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: "var(--bg-soft)", color: "var(--ink-2)" }}
            >
              {vibeEmoji[v]} {v === "WyjscieZeZnajomymi" ? "Znajomi" : v}
            </span>
          ))}
        </div>

        <h1 className="text-[28px] font-bold leading-tight tracking-tight" style={{ color: "var(--ink)" }}>
          {event.title}
        </h1>

        <div className="flex items-center gap-4">
          <HeatMeter score={event.score} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="📅" label="Kiedy" value={relativeDay(event.startDate)} sub={fmtDate(event.startDate, event.endDate) + (event.time ? ` · ${event.time}` : "")} />
          <StatCard icon="📍" label="Gdzie" value={event.placeName} sub={event.district === "Inny" ? "Poznań" : event.district} />
          <StatCard icon="👤" label="Idzie" value="Sprawdź" sub="" />
          <StatCard icon="🎫" label="Bilet" value={event.price ?? "Bezpłatny"} sub="Kup u źródła" />
        </div>

        {event.description && (
          <div className="p-4 rounded-2xl" style={{ background: "var(--bg-soft)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {event.description}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border-0 cursor-pointer no-underline" style={{ background: "var(--bg-soft)", color: "var(--ink)" }}>
            🗺️ Mapy
          </a>
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold border-0 cursor-pointer no-underline" style={{ background: "var(--bg-soft)", color: "var(--ink)" }}>
            🚀 Źródło
          </a>
        </div>
      </div>

      <div className="fixed bottom-4 left-3 right-3 z-40 flex gap-3">
        <button
          onClick={() => setSaved(!saved)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-0 cursor-pointer transition-all active:scale-90"
          style={{ background: saved ? "var(--ink)" : "var(--bg-elev)", color: saved ? "var(--bg)" : "var(--ink-2)", border: "0.5px solid var(--line)" }}
        >
          {saved ? "🔖" : "🏷️"}
        </button>
        <button
          onClick={() => setGoing(!going)}
          className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold border-0 cursor-pointer transition-all active:scale-[0.97]"
          style={{ background: going ? "var(--sage)" : "var(--ink)", color: "var(--bg)" }}
        >
          {going ? "✅ Idziesz!" : "🤘 Idę!"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="p-3.5 rounded-2xl" style={{ background: "var(--bg-soft)" }}>
      <span className="text-base">{icon}</span>
      <p className="text-[10px] font-bold mt-1.5 uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>
        {label}
      </p>
      <p className="text-sm font-bold mt-0.5" style={{ color: "var(--ink)" }}>
        {value}
      </p>
      {sub && <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{sub}</p>}
    </div>
  );
}
