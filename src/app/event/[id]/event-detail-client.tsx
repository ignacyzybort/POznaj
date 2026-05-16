"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PL_DAY_FULL, PL_MONTH_FULL, relDay, fmtFullDate } from "@/lib/date";
import { districts } from "@/lib/data";
import HeatMeter from "@/components/heat-meter";
import EventArt from "@/components/event-art";
import CategoryTag from "@/components/category-tag";
import VibePill from "@/components/vibe-pill";
import DetailExtras from "@/components/detail-extras";
import Toast from "@/components/toast";
import TiltCard from "@/components/tilt-card";
import Confetti from "@/components/confetti";
import { DUR } from "@/lib/duration";
import { CalIcon, PinIcon, UsersIcon, SparkIcon, BookmarkIcon, CheckIcon, BackIcon, ShareIcon } from "@/components/icons";

export type InitialEvent = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  startDate: string;
  endDate: string;
  time?: string;
  placeName: string;
  address?: string;
  district: string;
  category: string;
  vibes: string[];
  source: string;
  score: number;
  price?: string;
  outdoor: boolean;
  coordsX?: number;
  coordsY?: number;
};

function districtLabel(value: string) {
  return districts.find((d) => d.value === value)?.label ?? "Poznań";
}

export default function EventDetailClient({
  initial,
  initialSimilar,
}: {
  initial: InitialEvent;
  initialSimilar: InitialEvent[];
}) {
  const router = useRouter();
  const [event, setEvent] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [going, setGoing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reminded, setReminded] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [similar, setSimilar] = useState<InitialEvent[]>(initialSimilar);
  const [glowVisible, setGlowVisible] = useState(false);
  const [actionBarVisible, setActionBarVisible] = useState(false);
  const [similarVisible, setSimilarVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGlowVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setActionBarVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (initialSimilar.length > 0) {
      setTimeout(() => setSimilarVisible(true), 100);
    }
  }, [initialSimilar]);

  const onShare = async () => {
    try {
      await navigator.share({ title: event.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Skopiowano link 🔗");
    }
  };

  const onRemind = async () => {
    if (reminded) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("POznaj", { body: `${event.title} zaczyna się ${event.time ?? "wkrótce"}`, icon: "/icons/icon-192.png" });
      }
      setReminded(true);
      setToast("🔔 Przypomnimy Ci 30 min przed startem");
    } catch { setToast("🔔 Zapiszemy w przeglądarce"); setReminded(true); }
  };

  const toggleSave = async () => {
    if (!saved) {
      try {
        const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": document.cookie.split("; ").find(r => r.startsWith("csrf-token="))?.split("=")[1] ?? "" }, body: JSON.stringify({ eventId: event.id, status: "SAVED" }) });
        if (!res.ok) { setToast("Błąd zapisu"); return; }
        setToast("Zapisano ✅");
      } catch { setToast("Błąd zapisu"); }
    }
    setSaved((s) => !s);
  };

  const toggleGoing = async () => {
    const prev = going;
    setGoing(!going);
    if (!going) setConfetti(true);
    try {
      const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": document.cookie.split("; ").find(r => r.startsWith("csrf-token="))?.split("=")[1] ?? "" }, body: JSON.stringify({ eventId: event.id, status: "GOING" }) });
      if (!res.ok) throw new Error();
      setToast(going ? "Nie idziesz" : "Idziesz 🎉");
    } catch { setGoing(prev); setToast("Błąd"); }
  };

  return (
    <div data-category={event.category} style={{ position: "absolute", inset: 0, background: "var(--bg)", zIndex: 30 }}>
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, bottom: 90 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 5, padding: "calc(54px + var(--safe-t)) 16px 10px", display: "flex", justifyContent: "space-between", gap: 8 }}>
          <button onClick={() => router.back()} aria-label="Wróć" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}><BackIcon size={20} /></button>
          <button onClick={onShare} aria-label="Udostępnij" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}><ShareIcon size={20} /></button>
        </div>

        <div style={{ height: 340, overflow: "hidden" }}>
          <EventArt event={event} height={340} style="collage" />
        </div>

        <div className="pz-detail-glow" style={{ position: "absolute", top: 300, left: 0, right: 0, height: 200, pointerEvents: "none", zIndex: 1, "--glow-color": `var(--c-${event.category.toLowerCase()})`, opacity: glowVisible ? 1 : 0, transition: "opacity 0.6s" } as React.CSSProperties} />

        <div style={{ padding: "20px 18px 30px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <CategoryTag cat={event.category} size="md" />
            {event.vibes?.map((v: string) => <VibePill key={v} vibe={v} />)}
          </div>
          <h1 className="pz-h" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{event.title}</h1>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 22, background: "var(--bg-soft)", boxShadow: "var(--shadow-sm)" }}>
            <HeatMeter score={event.score} size="md" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <StatCard icon={<CalIcon size={14} />} label="Kiedy" title={`${relDay(new Date(event.startDate))}, ${event.time ?? "cały dzień"}`} sub={fmtFullDate(new Date(event.startDate))} />
            <StatCard icon={<PinIcon size={14} />} label="Gdzie" title={event.placeName} sub={`${districtLabel(event.district)}${event.address ? ` · ${event.address}` : ""}`} />
            <StatCard icon={<UsersIcon size={14} />} label="Popularność" title={event.score >= 70 ? "Bardzo popularne" : event.score >= 40 ? "Rośnie" : "Nowość"} sub={`${event.score} pkt · na podstawie dopasowania`} />
             <StatCard icon={<SparkIcon size={14} />} label="Bilet" title={event.price ? (event.price === "0 zł" ? "Wstęp wolny" : event.price) : "Sprawdź"} sub={event.price ? (event.price === "0 zł" ? "Za darmo" : "Kup u źródła") : "Skontaktuj się z organizatorem"} />
          </div>

          {event.description && <p style={{ marginTop: 18, fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{event.description}</p>}

          <div style={{ marginTop: 18 }}><DetailExtras event={event} onToast={setToast} /></div>

          <div style={{ marginTop: 18, padding: 14, borderRadius: 22, background: "var(--bg-soft)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="pz-eyebrow" style={{ marginBottom: 4 }}>Powiadom mnie</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>30 min przed startem</div>
            </div>
            <button onClick={onRemind} style={{ border: 0, background: reminded ? "var(--sage)" : "var(--ink)", color: "var(--bg)", padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44 }}>{reminded ? "🔔 Ustawiono" : "Włącz"}</button>
          </div>
        </div>

        {/* Similar events — at bottom of scroll, above action bar */}
        {similar.length > 0 && (
          <div style={{ padding: "0 18px 24px", transform: similarVisible ? "translateX(0)" : "translateX(40px)", opacity: similarVisible ? 1 : 0, transition: "transform 0.45s var(--ease-spring), opacity 0.35s var(--ease-out-quart)" }}>
            <div className="pz-eyebrow" style={{ marginBottom: 10 }}>Może Cię zainteresować</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
              {similar.map((ev) => (
                <TiltCard key={ev.id}>
                  <a href={`/event/${ev.id}`} onClick={(e) => { e.preventDefault(); router.push(`/event/${ev.id}`); }} style={{ flex: "0 0 200px", borderRadius: 22, overflow: "hidden", textDecoration: "none", color: "inherit", position: "relative", height: 200, boxShadow: "var(--shadow-sm)", display: "block" }}>
                  <EventArt event={ev} height={200} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(20,19,15,0.85) 100%)" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "white" }}>{ev.title}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.85, color: "white" }}>{ev.placeName}</p>
                    </div>
                  </div>
                </a>
                </TiltCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px calc(28px + var(--safe-b))", display: "flex", gap: 10, background: "linear-gradient(180deg, transparent, var(--bg) 30%)", transform: actionBarVisible ? "translateY(0)" : "translateY(80px)", opacity: actionBarVisible ? 1 : 0, transition: "transform 0.4s var(--ease-spring), opacity 0.3s var(--ease-out-quart)", transitionDelay: "0.3s" }}>
        <button onClick={() => { setAnimatingSave(true); toggleSave(); setTimeout(() => setAnimatingSave(false), 400); }} style={{ width: 50, height: 50, borderRadius: 99, border: 0, background: saved ? "var(--ink)" : "var(--bg-soft)", color: saved ? "var(--bg)" : "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <span className={saved && animatingSave ? "pz-bookmark-draw" : ""}>{saved ? <BookmarkIcon size={20} fill /> : <BookmarkIcon size={20} />}</span>
        </button>
        <button onClick={toggleGoing} className="pz-btn primary pz-btn-ripple" style={{ flex: 1, background: going ? "var(--sage)" : "var(--ink)" }}>
          {going ? <><CheckIcon size={18} /> Idziesz</> : "Idę"}
        </button>
      </div>

      <Confetti active={confetti} />
      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}

function StatCard({ icon, label, title, sub }: { icon: React.ReactNode; label: string; title: string; sub: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 22, background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-3)", marginBottom: 4 }}>
        <span style={{ width: 14, height: 14 }}>{icon}</span>
        <span className="pz-eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
