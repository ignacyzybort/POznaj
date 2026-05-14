"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EventData, districts } from "@/lib/data";
import { PL_DAY_FULL, PL_MONTH_FULL, relDay, fmtFullDate } from "@/lib/date";
import HeatMeter from "@/components/heat-meter";
import EventArt from "@/components/event-art";
import CategoryTag from "@/components/category-tag";
import VibePill from "@/components/vibe-pill";
import DetailExtras from "@/components/detail-extras";
import Toast from "@/components/toast";
import Confetti from "@/components/confetti";
import { DUR } from "@/lib/duration";
import { CalIcon, PinIcon, UsersIcon, SparkIcon, BookmarkIcon, CheckIcon, BackIcon, ShareIcon } from "@/components/icons";

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
  const [reminded, setReminded] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = () => {
    setError(null);
    fetch(`/api/events/${params.id}`).then((r) => {
      if (!r.ok) throw new Error("Nie znaleziono");
      return r.json();
    }).then((d) => {
      if (d.event) setEvent(d.event);
    }).catch(() => setError("Nie udało się załadować wydarzenia"));
  };

  useEffect(() => { fetchEvent(); }, [params.id]);

  const onRemind = async () => {
    if (reminded) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("POznaj", {
          body: `${event?.title ?? "Wydarzenie"} zaczyna się ${event?.time ?? "wkrótce"}`,
          icon: "/icons/icon-192.png",
        });
      }
      setReminded(true);
      setToast("🔔 Przypomnimy Ci 30 min przed startem");
    } catch {
      setToast("🔔 Zapiszemy w przeglądarce");
      setReminded(true);
    }
  };

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-4)" }}>
        <div className="pz-display" style={{ fontSize: 38, marginBottom: 12 }}>nic</div>
        <p style={{ fontWeight: 700 }}>{error}</p>
        <button onClick={() => { setError(null); fetchEvent(); }} className="pz-btn primary" style={{ height: 44, fontSize: 13, marginTop: 16 }}>Spróbuj ponownie</button>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-4)" }}>
        <div className="pz-display" style={{ fontSize: 38, marginBottom: 12 }}>nic</div>
        <p style={{ fontWeight: 700 }}>Ładowanie...</p>
      </div>
    );
  }

  const friends: { name: string }[] = [];

  const onShare = async () => {
    try {
      await navigator.share({ title: event?.title ?? "POznaj", url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Skopiowano link 🔗");
    }
  };

  const toggleSave = async () => {
    if (!saved) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: params.id, status: "SAVED" }),
        });
        if (!res.ok) { setToast("Błąd zapisu"); return; }
        setToast("Zapisano ✅");
      } catch { setToast("Błąd zapisu"); }
    }
    setSaved((s) => !s);
  };
  const toggleGoing = async () => {
    if (!going) {
      try {
        await fetch("/api/attendance", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: params.id, status: "GOING" }),
        });
        setToast("Idziesz 🎉");
      } catch { setToast("Błąd"); }
    }
    setGoing((g) => !g);
  };

  return (
    <div data-category={event.category} style={{
      position: "absolute", inset: 0, background: "var(--bg)",
      zIndex: 30,
    }}>
      {/* Scrollable content — ends above the action bar */}
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, bottom: 90 }}>
        {/* Detail header */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
          padding: "54px 16px 10px", display: "flex",
          justifyContent: "space-between", gap: 8,
        }}>
          <button onClick={() => router.back()} aria-label="Wróć" style={{
            width: 44, height: 44, borderRadius: 99, border: 0,
            background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}><BackIcon size={20} /></button>
          <button onClick={onShare} aria-label="Udostępnij" style={{
            width: 44, height: 44, borderRadius: 99, border: 0,
            background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}><ShareIcon size={20} /></button>
        </div>

        {/* Hero art */}
        <div style={{ height: 340, overflow: "hidden" }}>
          <EventArt event={event} height={340} style="collage" />
        </div>

        {/* Category glow */}
        <div className="pz-detail-glow" style={{ position: "absolute", top: 300, left: 0, right: 0, height: 200, pointerEvents: "none", zIndex: 1 }} />

        {/* Content */}
        <div style={{ padding: "20px 18px 30px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <CategoryTag cat={event.category} size="md" />
            {event.vibes?.map((v: string) => <VibePill key={v} vibe={v} />)}
          </div>
          <h1 className="pz-h" style={{
            margin: 0, fontSize: 30, fontWeight: 700,
            letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>{event.title}</h1>

          <div style={{
            marginTop: 16, padding: 14, borderRadius: 22,
            background: "var(--bg-soft)", boxShadow: "var(--shadow-sm)",
          }}>
            <HeatMeter score={event.score} size="md" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <StatCard icon={<CalIcon size={14} />} label="Kiedy"
              title={`${relDay(new Date(event.startDate))}, ${event.time ?? "cały dzień"}`}
              sub={fmtFullDate(new Date(event.startDate))} />
            <StatCard icon={<PinIcon size={14} />} label="Gdzie"
              title={event.placeName}
              sub={`${districtLabel(event.district)}${event.address ? ` · ${event.address}` : ""}`} />
            <StatCard icon={<UsersIcon size={14} />} label="Popularność"
              title={event.score >= 70 ? "Bardzo popularne" : event.score >= 40 ? "Rośnie" : "Nowość"}
              sub={`${event.score} pkt · na podstawie dopasowania`} />
            <StatCard icon={<SparkIcon size={14} />} label="Bilet"
              title={event.price && event.price !== "0 zł" ? event.price : "Sprawdź"}
              sub={event.price && event.price !== "0 zł" ? "Kup u źródła" : "Skontaktuj się z organizatorem"} />
          </div>

          {event.description && (
            <p style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
              {event.description}</p>
          )}

          <div style={{ marginTop: 18 }}>
            <DetailExtras event={event} onToast={setToast} />
          </div>

          {/* Notification row */}
          <div style={{
            marginTop: 18, padding: 14, borderRadius: 22,
            background: "var(--bg-soft)", boxShadow: "var(--shadow-sm)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div className="pz-eyebrow" style={{ marginBottom: 4 }}>Powiadom mnie</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>30 min przed startem</div>
            </div>
            <button onClick={onRemind} style={{
              border: 0, background: reminded ? "var(--sage)" : "var(--ink)",
              color: "var(--bg)", padding: "8px 14px", borderRadius: 99,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>{reminded ? "🔔 Ustawiono" : "Włącz"}</button>
          </div>
        </div>
      </div>

      {/* Pinned action bar — outside scroll, at the very bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "14px 16px calc(28px + var(--safe-b))", display: "flex", gap: 10,
        background: "linear-gradient(180deg, transparent, var(--bg) 30%)",
      }}>
        <button onClick={() => { setAnimatingSave(true); toggleSave(); setTimeout(() => setAnimatingSave(false), 400); }} style={{
          width: 50, height: 50, borderRadius: 99, border: 0,
          background: saved ? "var(--ink)" : "var(--bg-soft)",
          color: saved ? "var(--bg)" : "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className={saved && animatingSave ? "pz-bookmark-draw" : ""}>{saved ? <BookmarkIcon size={20} fill /> : <BookmarkIcon size={20} />}</span>
        </button>
        <button onClick={() => { if (!going) setConfetti(true); setGoing(!going); }} className="pz-btn primary pz-btn-ripple" style={{
          flex: 1, background: going ? "var(--sage)" : "var(--ink)",
        }}>
          {going ? <><CheckIcon size={18} /> Idziesz</> : "Idę"}
        </button>
      </div>

      <Confetti active={confetti} />
      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}

function StatCard({ icon, label, title, sub }: {
  icon: React.ReactNode; label: string; title: string; sub: string;
}) {
  return (
    <div style={{
      padding: 12, borderRadius: 22,
      background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)",
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
