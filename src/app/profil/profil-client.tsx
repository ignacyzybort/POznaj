"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PassportCard from "@/components/passport-card";
import StreakCard from "@/components/streak-card";
import VibeQuiz from "@/components/vibe-quiz";
import YearInReview from "@/components/year-in-review";
import InviteModal from "@/components/invite-modal";
import EditProfile from "@/components/edit-profile";
import Toast from "@/components/toast";
import { districts } from "@/lib/data";
import { SettingsIcon, EditIcon, ChevronIcon } from "@/components/icons";
import { computeChallenges } from "@/lib/challenges";

const COVER_GRADIENTS = [
  "linear-gradient(135deg, var(--c-muzyka), #FFB627)",
  "linear-gradient(135deg, var(--c-kino), var(--c-muzyka))",
  "linear-gradient(135deg, var(--c-sztuka), #06B6D4)",
  "linear-gradient(135deg, #C8FF2E, var(--sage))",
  "linear-gradient(135deg, var(--c-teatr), var(--c-sztuka))",
  "linear-gradient(135deg, var(--c-warsztaty), var(--c-teatr))",
  "linear-gradient(135deg, var(--c-konferencje), var(--c-kino))",
];
const COLORS = ["#FF3D7F", "#6E3DFF", "#2860FF", "#C8FF2E", "#FF6B2C", "#E89A6B", "#FFB627"];
function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "przed chwilą";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} godz temu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dni temu`;
  return `${Math.floor(days / 7)} tyg temu`;
}

const MONTHS = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function getBadge(count: number): { emoji: string; title: string } {
  if (count === 0) return { emoji: "🌱", title: "Nowicjusz" };
  if (count < 5) return { emoji: "🧭", title: "Odkrywca" };
  if (count < 15) return { emoji: "🏅", title: "Bywalec" };
  if (count < 30) return { emoji: "⭐", title: "Stały bywalec" };
  return { emoji: "👑", title: "Legenda Poznania" };
}

export type InitialProfile = {
  user: {
    id: string;
    name: string | null;
    handle: string | null;
    bio: string | null;
    district: string | null;
    image: string | null;
    coverImage: string | null;
    _count: { attendance: number; savedEvents: number; sentFriendships: number };
  };
  attendance: { id: string; status: string; event: { id: string; title: string; placeName: string; startDate: string; category: string; district: string; imageUrl: string | null } }[];
  friends: { id: string; name: string | null }[];
  activities: { id: string; type: string; createdAt: string; user: { id: string; name: string | null; image: string | null }; event: { id: string; title: string; startDate: string; category: string } }[];
  notifications: { id: string; type: string; title: string; body: string | null; createdAt: string }[];
  requests: { id: string; senderId: string; senderName: string; createdAt: string }[];
};

export default function ProfilClient({ initial }: { initial: InitialProfile }) {
  const [userData, setUserData] = useState(initial.user);
  const [attendanceData, setAttendanceData] = useState(initial.attendance);
  const [friendsList, setFriendsList] = useState(
    initial.friends.slice(0, 5).map((x, i) => ({
      id: x.id,
      name: x.name ?? "Znajomy",
      color: COLORS[i % COLORS.length],
    })),
  );
  const [activities, setActivities] = useState(initial.activities);
  const [notifs, setNotifs] = useState(initial.notifications);
  const [pendingReqs, setPendingReqs] = useState(initial.requests);
  const [stats, setStats] = useState(initial.user._count);

  const [showQuiz, setShowQuiz] = useState(false);
  const [yirOpen, setYirOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNotifs = () => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setNotifs(d.notifications ?? []);
      setPendingReqs(d.requests ?? []);
    }).catch((e) => console.error("notifs refetch failed", e));
  };

  // Re-fetch after profile edits / refresh triggers (skip initial mount).
  useEffect(() => {
    if (refreshKey === 0) return;
    const ctrl = new AbortController();
    Promise.all([
      fetch("/api/friends", { signal: ctrl.signal }).then((r) => r.json()).then((d) => {
        setFriendsList((d.friends ?? []).slice(0, 5).map((x: { id: string; name?: string | null }, i: number) => ({
          id: x.id, name: x.name ?? "Znajomy", color: COLORS[i % COLORS.length],
        })));
      }),
      fetch("/api/user/preferences", { signal: ctrl.signal }).then((r) => r.json()).then((d) => {
        if (d.user) {
          setUserData(d.user);
          if (d.user._count) setStats(d.user._count);
        }
      }),
      fetch("/api/attendance", { signal: ctrl.signal }).then((r) => r.json()).then((d) => {
        setAttendanceData(d.attendance ?? []);
      }),
      fetch("/api/activities", { signal: ctrl.signal }).then((r) => r.json()).then((d) => {
        setActivities(d.activities ?? []);
      }),
    ]).catch((e) => {
      if (e?.name === "AbortError") return;
      console.error("profile refetch failed", e);
    });
    return () => ctrl.abort();
  }, [refreshKey]);

  const goingItems = attendanceData.filter((a) => a.status === "GOING");
  const weeksActive = Math.min(goingItems.length, 8);
  const badge = getBadge(goingItems.length);
  const challenges = computeChallenges(goingItems);

  const catCount: Record<string, number> = {};
  const venueCount: Record<string, number> = {};
  const stamps: Record<string, number> = {};
  const monthlyCount = new Array(12).fill(0);
  for (const a of goingItems) {
    const cat = a.event?.category; if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    const venue = a.event?.placeName; if (venue) venueCount[venue] = (venueCount[venue] || 0) + 1;
    const dist = a.event?.district; if (dist) stamps[dist] = (stamps[dist] || 0) + 1;
    const date = a.event?.startDate ? new Date(a.event.startDate) : null;
    if (date && date.getFullYear() === new Date().getFullYear()) monthlyCount[date.getMonth()]++;
  }
  for (const d of districts) { if (!stamps[d.value]) stamps[d.value] = 0; }
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  const topVenue = Object.entries(venueCount).sort((a, b) => b[1] - a[1])[0];
  const maxMonth = Math.max(...monthlyCount, 1);

  const name = userData.name ?? "Użytkownik";
  const handle = userData.handle ?? name.toLowerCase().replace(/\s/g, "");
  const bio = userData.bio ?? "";
  const districtLabel = userData.district ? (districts.find((d) => d.value === userData.district)?.label ?? userData.district) : "";
  const avatarUrl = userData.image;
  const coverUrl = userData.coverImage;

  const coverGradient = COVER_GRADIENTS[name.length % COVER_GRADIENTS.length];

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      {/* Wordmark */}
      <div style={{ padding: "calc(24px + var(--safe-t)) 18px 12px" }}>
        <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0, color: "var(--ink)" }}>
          poznaj<span style={{ color: "var(--sage)" }}>.</span>
        </h1>
      </div>

      {/* Cover banner — 120px */}
      <div style={{ margin: "0 18px", height: 120, borderRadius: 22, position: "relative", overflow: "hidden", background: coverUrl ? "none" : coverGradient }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {coverUrl && <img src={coverUrl} alt="Zdjęcie w tle profilu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          <Link href="/settings" style={{ width: 36, height: 36, borderRadius: 99, border: 0, background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "var(--shadow-sm)" }}>
            <SettingsIcon size={18} />
          </Link>
          <button onClick={() => setEditOpen(true)} style={{ width: 36, height: 36, borderRadius: 99, border: 0, background: "var(--bg-elev)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
            <EditIcon size={18} />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 99, overflow: "hidden", border: "3px solid var(--bg)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", flexShrink: 0, background: avatarUrl ? "none" : coverGradient }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Zdjęcie profilowe" className="w-full h-full object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 28, fontWeight: 800 }}>
                {name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div className="pz-h" style={{ fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, color: "var(--ink)" }}>{name}</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", marginTop: 1 }}>@{handle}{districtLabel ? ` · ${districtLabel}` : ""}</div>
          </div>
        </div>
      </div>

      {bio && <div style={{ padding: "14px 18px 0" }}><p style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--ink-2)" }}>{bio}</p></div>}

      {/* Stats grid */}
      <div style={{ padding: "14px 18px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { n: stats.attendance, l: "plany" }, { n: stats.savedEvents, l: "zapisane" }, { n: friendsList.length, l: "znajomi" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 18, background: "var(--bg-soft)", textAlign: "center" }}>
              <div className="pz-num" style={{ fontSize: "var(--text-lg)", fontWeight: 700, letterSpacing: "-0.02em" }}>{s.n}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badge + Monthly chart */}
      <div style={{ padding: "0 18px 14px" }}>
        <div className="pz-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div><span style={{ fontSize: "var(--text-lg)", marginRight: 8 }}>{badge.emoji}</span><span className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, letterSpacing: "-0.02em" }}>{badge.title}</span></div>
            <span className="pz-num" style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>{goingItems.length} wydarzeń</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
            {monthlyCount.map((val, i) => {
              const h = Math.max(3, (val / maxMonth) * 40);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: h, background: i === new Date().getMonth() ? "var(--sage)" : "var(--line-2)" }} />
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-4)" }}>{MONTHS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Challenges */}
      {challenges.length > 0 && (
        <div style={{ padding: "0 18px 14px" }}>
          <div className="pz-card" style={{ padding: 14 }}>
            <div className="pz-eyebrow" style={{ marginBottom: 10 }}>Wyzwania</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {challenges.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{c.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{c.title}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.done ? "var(--sage)" : "var(--ink-3)" }}>
                      {c.done ? "✅" : `${c.progress}/${c.max}`}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: "var(--line-2)", overflow: "hidden" }}>
                    <div style={{ width: `${(c.progress / c.max) * 100}%`, height: "100%", borderRadius: 99, background: c.done ? "var(--sage)" : "var(--ink-3)", transition: "width var(--dur-slow) var(--ease-out-quart)" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity stats */}
      <div style={{ padding: "0 18px 14px" }}>
        <div className="pz-card" style={{ padding: 14 }}>
          <div className="pz-eyebrow" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>Aktywność</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topCategory && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}><span style={{ color: "var(--ink-2)" }}>Najczęstsza kategoria</span><span style={{ fontWeight: 700, color: "var(--ink)" }}>{topCategory[0]} · {topCategory[1]}x</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}><span style={{ color: "var(--ink-2)" }}>Odwiedzone dzielnice</span><span style={{ fontWeight: 700, color: "var(--ink)" }}>{Object.values(stamps).filter(Boolean).length} / 10</span></div>
            {topVenue && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}><span style={{ color: "var(--ink-2)" }}>Ulubione miejsce</span><span style={{ fontWeight: 700, color: "var(--ink)", textAlign: "right", maxWidth: "50%" }}>{topVenue[0]} · {topVenue[1]}x</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}><span style={{ color: "var(--ink-2)" }}>W tym miesiącu</span><span style={{ fontWeight: 700, color: "var(--ink)" }}>{monthlyCount[new Date().getMonth()]}</span></div>
          </div>
        </div>
      </div>

      {/* Streak + Passport */}
      <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StreakCard weeks={weeksActive} longest={Math.max(weeksActive, 1)} />
        <PassportCard stamps={stamps} />
      </div>

      {/* Notifications */}
      {(pendingReqs.length > 0 || notifs.length > 0) && (
        <div style={{ padding: "0 18px 14px" }}>
          <div className="pz-card" style={{ padding: 16 }}>
            <div className="pz-eyebrow" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>Powiadomienia ({pendingReqs.length + notifs.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pendingReqs.map((req) => (
                <div key={req.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid var(--line)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 99, background: COLORS[(req.senderId?.length ?? 0) % COLORS.length] ?? "#888", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "var(--text-base)", fontWeight: 800, flexShrink: 0 }}>{req.senderName?.[0]?.toUpperCase() ?? "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>{req.senderName}</div><div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>chce być Twoim znajomym</div></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={async () => { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: req.id, action: "accept" }) }); setToast("✅ Znajomy dodany!"); fetchNotifs(); }} style={{ border: 0, padding: "6px 14px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 600, background: "var(--sage)", color: "white", cursor: "pointer" }}>Akceptuj</button>
                    <button onClick={async () => { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: req.id, action: "reject" }) }); fetchNotifs(); }} style={{ border: 0, padding: "6px 14px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 600, background: "var(--bg-soft)", color: "var(--ink-3)", cursor: "pointer" }}>Odrzuć</button>
                  </div>
                </div>
              ))}
              {notifs.filter((n) => n.type !== "FRIEND_REQUEST").map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid var(--line)" }}>
                  <span style={{ fontSize: 20 }}>🔔</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink)" }}>{n.title}</div>{n.body && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{n.body}</div>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vibe quiz + wrapped */}
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => setShowQuiz(true)} className="pz-card" style={{ padding: 16, width: "100%", textAlign: "left", cursor: "pointer", border: "none", background: "var(--bg-elev)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#C8FF2E,#2EC36B)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0F1A0A", fontSize: "var(--text-lg)", fontWeight: 800 }}>?</div>
          <div style={{ flex: 1 }}><div className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, letterSpacing: "-0.02em" }}>Tune-up nastroju</div><div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: 2 }}>4 pytania · odpalimy świeży feed</div></div>
          <span style={{ color: "var(--ink-3)" }}><ChevronIcon size={18} /></span>
        </button>
        <button onClick={() => setYirOpen(true)} style={{ padding: 16, width: "100%", textAlign: "left", cursor: "pointer", border: "none", borderRadius: 22, color: "white", background: "linear-gradient(135deg,#6E3DFF 0%,#FF3D7F 60%,#FF6B2C 100%)", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 24px rgba(110,61,255,0.22)" }}>
          <div><div style={{ fontSize: "var(--text-xs)", fontWeight: 700, opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>POznaj wrapped</div><div className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginTop: 4 }}>Twój 2026</div><div style={{ fontSize: "var(--text-sm)", opacity: 0.9, marginTop: 6 }}>{goingItems.length} wydarzeń · {Object.values(stamps).filter(Boolean).length} dzielnic · {friendsList.length} osób</div></div>
          <span style={{ marginLeft: "auto", opacity: 0.85 }}><ChevronIcon size={18} /></span>
        </button>
      </div>

      {/* Friends */}
      <div style={{ padding: "0 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 className="pz-h" style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.02em" }}>Znajomi</h2>
          <button onClick={() => setInviteOpen(true)} style={{ border: 0, background: "transparent", color: "var(--ink-3)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer" }}>Zaproś +</button>
        </div>
      </div>
      {friendsList.length > 0 ? (
        <div style={{ padding: "0 18px 14px", display: "flex", gap: 14, overflowX: "auto" }}>
          {friendsList.map((f) => (
            <a key={f.id} href={`/user/${f.id}`} style={{ textAlign: "center", flex: "0 0 56px", textDecoration: "none" }}>
              <div style={{ width: 52, height: 52, borderRadius: 99, background: f.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-lg)", fontWeight: 800, border: "2px solid var(--bg)", boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}>{f.name[0]}</div>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, marginTop: 6, color: "var(--ink-2)" }}>{f.name}</div>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ padding: "0 18px 14px" }}><p style={{ fontSize: "var(--text-sm)", color: "var(--ink-4)", textAlign: "center", padding: "12px 0" }}>Zaproś znajomych!</p></div>
      )}

      {/* Activity feed */}
      <div style={{ padding: "8px 18px 0" }}>
        <h2 className="pz-h" style={{ margin: "8px 0 12px", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.02em" }}>Co u znajomych</h2>
        {activities.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activities.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 99, background: `hsl(${((a.user?.name ?? "").length * 37) % 360},70%,55%)`, color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {a.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.4 }}>
                    <b style={{ color: "var(--ink)" }}>{a.user?.name ?? "Znajomy"}</b>{a.type === "GOING" ? " idzie na " : " zapisał "}
                    <b style={{ color: "var(--ink)" }}>{a.event?.title ?? "wydarzenie"}</b>
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginTop: 2 }}>
                    {timeAgo(new Date(a.createdAt))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-4)", textAlign: "center", padding: "12px 0" }}>Kiedy znajomi dodadzą wydarzenia, zobaczysz je tutaj.</p>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={() => signOut()} className="pz-btn ghost" style={{ width: "100%", height: 50, fontSize: 14 }}>Wyloguj się</button>
      </div>

      {showQuiz && <VibeQuiz onClose={() => setShowQuiz(false)} />}
      <YearInReview open={yirOpen} onClose={() => setYirOpen(false)}
        stats={{ events: goingItems.length, newPlaces: Object.values(stamps).filter(Boolean).length, friends: friendsList.length, topDistrict: Object.entries(stamps).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Poznań", topCategory: topCategory?.[0] ?? "Kulturalne" }} />
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {editOpen && (
        <EditProfile
          user={{ name, handle, bio, district: userData.district, image: userData.image, coverImage: userData.coverImage }}
          onClose={() => setEditOpen(false)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}
