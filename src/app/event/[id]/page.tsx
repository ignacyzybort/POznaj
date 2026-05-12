"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventData, categoryEmoji, vibeEmoji } from "@/lib/data";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import { BackIcon, ShareIcon, CalIcon, PinIcon, UsersIcon, SparkIcon, BookmarkIcon, CheckIcon } from "@/components/icons";

const PL_MONTH_FULL = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const PL_DAY_FULL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

function relDay(d: Date): string {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const days = Math.round((dd.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Dziś";
  if (days === 1) return "Jutro";
  if (days < 0) return "Było";
  if (days < 7) return PL_DAY_FULL[dd.getDay()];
  return `${d.getDate()} ${PL_MONTH_FULL[d.getMonth()]}`;
}

function fmtFullDate(d: Date) {
  return `${d.getDate()} ${PL_MONTH_FULL[d.getMonth()]}`;
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

  const friends = [
    { name: "A" }, { name: "K" }, { name: "M" },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: "var(--bg)", zIndex: 30, animation: "pz-fade-in 0.32s ease both" }}>
      {/* Detail header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 5, padding: "54px 16px 10px", display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
          <BackIcon size={20} />
        </button>
        <button onClick={() => {}} style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.10)" }}>
          <ShareIcon size={20} />
        </button>
      </div>

      {/* Hero art */}
      <div style={{ height: 340, overflow: "hidden", background: "var(--bg-soft)" }}>
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl" style={{ background: "var(--bg-soft)" }}>
            {categoryEmoji[event.category] ?? "📌"}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 18px 140px" }}>
        {/* Category + vibe pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <CategoryTag cat={event.category} />
          {event.vibes?.map((v: string) => <VibePill key={v} vibe={v} />)}
        </div>

        {/* Title */}
        <h1 className="font-bold m-0" style={{ fontSize: 30, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--ink)" }}>
          {event.title}
        </h1>

        {/* Heat + friends */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 18, background: "var(--bg-soft)", border: "0.5px solid var(--line)" }}>
          <HeatMeter score={event.score} size="md" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <AvStack people={friends} max={4} size={26} />
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
              <b>Alicja, Kuba</b>
              <span style={{ color: "var(--ink-3)" }}> +1 idą</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <StatCard icon={<CalIcon size={14} />} label="Kiedy" title={`${relDay(new Date(event.startDate))}, ${event.time ?? "cały dzień"}`} sub={fmtFullDate(new Date(event.startDate))} />
          <StatCard icon={<PinIcon size={14} />} label="Gdzie" title={event.placeName} sub={`${event.district === "Inny" ? "Poznań" : event.district}${event.address ? ` · ${event.address}` : ""}`} />
          <StatCard icon={<UsersIcon size={14} />} label="Idzie" title="412" sub="3 ze znajomych" />
          <StatCard icon={<SparkIcon size={14} />} label="Bilet" title={event.price ?? "Bezpłatny"} sub="Kup u źródła" />
        </div>

        {/* Description */}
        {event.description && (
          <p style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{event.description}</p>
        )}

        {/* Notification row */}
        <div style={{ marginTop: 18, padding: 14, borderRadius: 18, background: "var(--bg-soft)", border: "0.5px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ink-4)", marginBottom: 4 }}>Powiadom mnie</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>30 min przed startem</div>
          </div>
          <button style={{ border: 0, background: "var(--ink)", color: "var(--bg)", padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Włącz
          </button>
        </div>
      </div>

      {/* Pinned action bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 16px 28px", display: "flex", gap: 10, background: "linear-gradient(180deg, transparent, var(--bg) 30%)", pointerEvents: "none" }}>
        <button onClick={() => setSaved(!saved)} style={{ pointerEvents: "auto", width: 50, height: 50, borderRadius: 99, border: 0, background: saved ? "var(--ink)" : "var(--bg-soft)", color: saved ? "var(--bg)" : "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <BookmarkIcon size={20} fill={saved} />
        </button>
        <button onClick={() => setGoing(!going)} style={{ pointerEvents: "auto", flex: 1, height: 50, borderRadius: 99, border: 0, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: going ? "var(--sage)" : "var(--ink)", color: "var(--bg)" }}>
          {going ? <><CheckIcon size={18} /> Idziesz</> : "Idę"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, title, sub }: { icon: React.ReactNode; label: string; title: string; sub: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 16, background: "var(--bg-elev)", border: "0.5px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", marginBottom: 4 }}>
        <span style={{ width: 14, height: 14 }}>{icon}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function CategoryTag({ cat }: { cat: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    Muzyka: { bg: "#FF3D7F", fg: "#4A0B23" }, Kino: { bg: "#6E3DFF", fg: "#1F0A55" },
    Sztuka: { bg: "#2860FF", fg: "#07194C" }, Sport: { bg: "#C8FF2E", fg: "#1F2A04" },
    Teatr: { bg: "#FF6B2C", fg: "#4A1A02" }, Warsztaty: { bg: "#E89A6B", fg: "#3A1C0A" },
    Konferencje: { bg: "#1F2D5A", fg: "#F4F4FB" }, Jedzenie: { bg: "#FFB627", fg: "#3A2200" },
    Inne: { bg: "#E8E3D8", fg: "#1A1A1A" },
  };
  const c = colors[cat] ?? colors.Inne;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.bg, color: c.fg, padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "-0.005em" }}>
      {cat}
    </span>
  );
}

function VibePill({ vibe }: { vibe: string }) {
  const emoji: Record<string, string> = { Randka: "💕", Impreza: "🥳", WyjscieZeZnajomymi: "👥", Rodzinne: "🧸", Spokojne: "🌙", Kulturalne: "🎭", Aktywne: "⚡" };
  const labels: Record<string, string> = { Randka: "Randka", Impreza: "Impreza", WyjscieZeZnajomymi: "Znajomi", Rodzinne: "Rodzinne", Spokojne: "Spokojne", Kulturalne: "Kulturalne", Aktywne: "Aktywne" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--bg-soft)", color: "var(--ink-2)", border: "0.5px solid transparent" }}>
      <span>{emoji[vibe] ?? ""}</span>
      {labels[vibe] ?? vibe}
    </span>
  );
}
