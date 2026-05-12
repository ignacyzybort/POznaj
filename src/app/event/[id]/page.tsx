"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventData, districts } from "@/lib/data";
import HeatMeter from "@/components/heat-meter";
import AvStack from "@/components/av-stack";
import EventArt from "@/components/event-art";
import CategoryTag from "@/components/category-tag";
import VibePill from "@/components/vibe-pill";
import DetailExtras from "@/components/detail-extras";
import Toast from "@/components/toast";
import { CalIcon, PinIcon, UsersIcon, SparkIcon, BookmarkIcon, CheckIcon, BackIcon, ShareIcon } from "@/components/icons";
import { deriveFriendsGoing } from "@/lib/mock-extras";

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
function fmtFullDate(d: Date) { return `${d.getDate()} ${PL_MONTH_FULL[d.getMonth()]}`; }
function districtLabel(value: string) {
  return districts.find((d) => d.value === value)?.label ?? "Poznań";
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [saved, setSaved] = useState(false);
  const [going, setGoing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${params.id}`).then((r) => r.json()).then((d) => {
      if (d.event) setEvent(d.event);
    });
  }, [params.id]);

  if (!event) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-4)" }}>
        <div className="pz-display" style={{ fontSize: 38, marginBottom: 12 }}>nic</div>
        <p style={{ fontWeight: 700 }}>Nie znaleziono</p>
        <button onClick={() => router.back()} style={{
          fontSize: 13, marginTop: 8, cursor: "pointer", background: "none",
          border: "none", color: "var(--ink-3)", textDecoration: "underline",
        }}>Wróć</button>
      </div>
    );
  }

  const friends = deriveFriendsGoing(event);
  const goingCount = event.going ?? 100 + friends.length * 50;

  const onShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`).catch(() => {});
    }
    setToast("Skopiowano link 🔗");
  };

  const toggleSave = () => {
    setSaved((s) => !s);
    setToast(saved ? null : "Zapisano");
  };
  const toggleGoing = () => {
    setGoing((g) => !g);
    setToast(going ? null : "Idziesz 🎉");
  };

  return (
    <div className="pz-scroll" style={{
      position: "absolute", inset: 0, background: "var(--bg)",
      zIndex: 30, animation: "pz-fade-in 0.32s ease both",
    }}>
      {/* Detail header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
        padding: "54px 16px 10px", display: "flex",
        justifyContent: "space-between", gap: 8,
      }}>
        <button onClick={() => router.back()} aria-label="Wróć" style={{
          width: 40, height: 40, borderRadius: 99, border: 0,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
          color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
        }}><BackIcon size={20} /></button>
        <button onClick={onShare} aria-label="Udostępnij" style={{
          width: 40, height: 40, borderRadius: 99, border: 0,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
          color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
        }}><ShareIcon size={20} /></button>
      </div>

      {/* Hero art */}
      <div style={{ height: 340, overflow: "hidden" }}>
        <EventArt event={event} height={340} style="collage" />
      </div>

      {/* Content */}
      <div style={{ padding: "20px 18px 140px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <CategoryTag cat={event.category} size="md" />
          {event.vibes?.map((v: string) => <VibePill key={v} vibe={v} />)}
        </div>

        <h1 className="pz-h" style={{
          margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05,
        }}>{event.title}</h1>

        <div style={{
          marginTop: 16, padding: 14, borderRadius: 18,
          background: "var(--bg-soft)", border: "0.5px solid var(--line)",
        }}>
          <HeatMeter score={event.score} size="md" />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <AvStack people={friends} max={4} size={26} />
            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
              <b>{friends.slice(0, 2).map((f) => f.name).join(", ")}</b>
              {friends.length > 2 && ` + ${friends.length - 2}`}
              <span style={{ color: "var(--ink-3)" }}> idą</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 10, marginTop: 14,
        }}>
          <StatCard icon={<CalIcon size={14} />}
                    label="Kiedy"
                    title={`${relDay(new Date(event.startDate))}, ${event.time ?? "cały dzień"}`}
                    sub={fmtFullDate(new Date(event.startDate))} />
          <StatCard icon={<PinIcon size={14} />}
                    label="Gdzie"
                    title={event.placeName}
                    sub={`${districtLabel(event.district)}${event.address ? ` · ${event.address}` : ""}`} />
          <StatCard icon={<UsersIcon size={14} />}
                    label="Idzie"
                    title={goingCount.toLocaleString("pl-PL")}
                    sub={`${friends.length} ze znajomych`} />
          <StatCard icon={<SparkIcon size={14} />}
                    label="Bilet"
                    title={event.price ?? "Bezpłatny"}
                    sub="Kup u źródła" />
        </div>

        {event.description && (
          <p style={{
            marginTop: 18, fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-2)",
          }}>{event.description}</p>
        )}

        <div style={{ marginTop: 18 }}>
          <DetailExtras event={event} onToast={setToast} />
        </div>

        {event.sourceUrl && (
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginTop: 12, padding: "10px 14px", borderRadius: 14,
            background: "var(--bg-soft)", color: "var(--ink)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>Otwórz źródło ↗</a>
        )}

        <div style={{
          marginTop: 18, padding: 14, borderRadius: 18,
          background: "var(--bg-soft)", border: "0.5px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div className="pz-eyebrow" style={{ marginBottom: 4 }}>Powiadom mnie</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>30 min przed startem</div>
          </div>
          <button onClick={() => setToast("🔔 Przypomnimy Ci")} style={{
            border: 0, background: "var(--ink)", color: "var(--bg)",
            padding: "8px 14px", borderRadius: 99,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Włącz</button>
        </div>
      </div>

      {/* Pinned action bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "14px 16px 28px", display: "flex", gap: 10,
        background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
        pointerEvents: "none",
      }}>
        <button onClick={toggleSave} style={{
          pointerEvents: "auto",
          width: 50, height: 50, borderRadius: 99, border: 0,
          background: saved ? "var(--ink)" : "var(--bg-soft)",
          color: saved ? "var(--bg)" : "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }} aria-label={saved ? "Usuń z zapisanych" : "Zapisz"}>
          <BookmarkIcon size={20} fill={saved} />
        </button>
        <button onClick={toggleGoing} className="pz-btn primary" style={{
          pointerEvents: "auto", flex: 1, background: going ? "var(--sage)" : "var(--ink)",
        }}>
          {going ? <><CheckIcon size={18} /> Idziesz</> : "Idę"}
        </button>
      </div>

      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}

function StatCard({ icon, label, title, sub }: {
  icon: React.ReactNode; label: string; title: string; sub: string;
}) {
  return (
    <div style={{
      padding: 12, borderRadius: 16,
      background: "var(--bg-elev)", border: "0.5px solid var(--line)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        color: "var(--ink-3)", marginBottom: 4,
      }}>
        <span style={{ width: 14, height: 14 }}>{icon}</span>
        <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)",
      }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
