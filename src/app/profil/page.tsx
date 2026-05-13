"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PassportCard from "@/components/passport-card";
import StreakCard from "@/components/streak-card";
import VibeQuiz from "@/components/vibe-quiz";
import YearInReview from "@/components/year-in-review";
import InviteModal from "@/components/invite-modal";
import Toast from "@/components/toast";
import { districts } from "@/lib/data";

const COLORS = ["#FF3D7F", "#6E3DFF", "#2860FF", "#C8FF2E", "#FF6B2C", "#E89A6B", "#FFB627"];

export default function ProfilPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ attendance: 0, savedEvents: 0, sentFriendships: 0 });
  const [stamps, setStamps] = useState<Record<string, number>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [yirOpen, setYirOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; color: string }[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);

  const fetchNotifs = () => {
    if (!session?.user) return;
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setNotifs(d.notifications ?? []);
      setPendingReqs(d.requests ?? []);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchNotifs();
    fetch("/api/friends").then((r) => r.json()).then((d) => {
      setFriendsList((d.friends ?? []).slice(0, 5).map((x: any, i: number) => ({
        id: x.id,
        name: x.name ?? "Znajomy",
        color: COLORS[i % COLORS.length],
      })));
    }).catch(() => {});
    fetch("/api/user/preferences").then((r) => r.json()).then((d) => {
      if (d.user?._count) setStats(d.user._count);
    });
    fetch("/api/attendance").then((r) => r.json()).then((d) => {
      const items = d.attendance ?? [];
      setAttendanceData(items);
      const s: Record<string, number> = {};
      for (const a of items) {
        const dist = a.event?.district;
        if (dist) s[dist] = (s[dist] || 0) + 1;
      }
      for (const d of districts) {
        if (!s[d.value]) s[d.value] = 0;
      }
      setStamps(s);
    });
  }, [session]);

  const weeksActive = Math.min(attendanceData.length, 8);

  if (!session?.user) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0 }}>
        <div style={{ padding: "54px 18px 18px" }}>
          <div className="pz-eyebrow" style={{ marginBottom: 6 }}>Profil</div>
          <h1 className="pz-h" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em" }}>Twoje konto.</h1>
        </div>
        <div style={{ padding: "0 18px" }}>
          <div style={{ padding: 32, borderRadius: 22, background: "var(--bg-soft)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--ink-2)" }}>
              Zaloguj się, aby zapisywać wydarzenia i łączyć ze znajomymi
            </p>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, padding: "0 24px", borderRadius: 28, fontSize: 15, fontWeight: 600, background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}>
              Zaloguj się
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const topDistrict = Object.entries(stamps).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Poznań";
  const catCount: Record<string, number> = {};
  for (const a of attendanceData) {
    const cat = a.event?.category;
    if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
  }
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Kulturalne";

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: "54px 18px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 99,
            background: "linear-gradient(135deg, #FF3D7F, #FFB627)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
          }}>
            {session.user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="pz-h" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {session.user.name ?? "Użytkownik"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              @{(session.user.name ?? "user").toLowerCase().replace(/\s/g, "")} · Jeżyce
            </div>
          </div>
        </div>
        <Link href="/settings" style={{
          width: 40, height: 40, borderRadius: 99, border: 0,
          background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.5-2.4.8a7 7 0 0 0-1.9-1.1L14 3h-4l-.6 2.6a7 7 0 0 0-1.9 1.1L5.1 6 3.1 9.5l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.5 2.4-.8c.6.5 1.2.8 1.9 1.1L10 21h4l.6-2.6c.7-.2 1.3-.6 1.9-1.1l2.4.8 2-3.5-2-1.5c.1-.3.1-.7.1-1.1z"/></svg>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 18px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { n: stats.attendance, l: "plany" },
            { n: stats.savedEvents, l: "zapisane" },
            { n: friendsList.length, l: "znajomi" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 18, background: "var(--bg-soft)", textAlign: "center" }}>
              <div className="pz-num" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.n}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak + Passport */}
      <div style={{ padding: "0 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StreakCard weeks={weeksActive} longest={Math.max(weeksActive, 1)} />
        <PassportCard stamps={stamps} />
      </div>

      {/* Notifications Inbox */}
      {(pendingReqs.length > 0 || notifs.length > 0) && (
        <div style={{ padding: "0 18px 14px" }}>
          <div className="pz-card" style={{ padding: 16 }}>
            <div className="pz-eyebrow" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📬</span>
              <span>Powiadomienia ({pendingReqs.length + notifs.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {pendingReqs.map((req) => (
                <div key={req.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "0.5px solid var(--line)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 99,
                    background: COLORS[req.senderId?.length % COLORS.length] ?? "#888",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}>{req.senderName?.[0]?.toUpperCase() ?? "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{req.senderName}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>chce być Twoim znajomym</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={async () => {
                      await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notificationId: req.id, action: "accept" }),
                      });
                      setToast("✅ Znajomy dodany!");
                      fetchNotifs();
                    }} style={{
                      border: 0, padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: "var(--sage)", color: "white", cursor: "pointer",
                    }}>Akceptuj</button>
                    <button onClick={async () => {
                      await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notificationId: req.id, action: "reject" }),
                      });
                      fetchNotifs();
                    }} style={{
                      border: 0, padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: "var(--bg-soft)", color: "var(--ink-3)", cursor: "pointer",
                    }}>Odrzuć</button>
                  </div>
                </div>
              ))}
              {notifs.filter(n => n.type !== "FRIEND_REQUEST").map((n) => (
                <div key={n.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "0.5px solid var(--line)",
                }}>
                  <span style={{ fontSize: 20 }}>🔔</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{n.body}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vibe quiz + Year-in-review */}
      <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => setShowQuiz(true)} className="pz-card" style={{
          padding: 16, width: "100%", textAlign: "left", cursor: "pointer",
          border: "none", background: "var(--bg-elev)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg,#C8FF2E,#2EC36B)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#0F1A0A", fontSize: 22, fontWeight: 800,
          }}>?</div>
          <div style={{ flex: 1 }}>
            <div className="pz-h" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>Tune-up nastroju</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>4 pytania · odpalimy świeży feed</div>
          </div>
          <span style={{ color: "var(--ink-3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          </span>
        </button>

        <button onClick={() => setYirOpen(true)} style={{
          padding: 16, width: "100%", textAlign: "left", cursor: "pointer",
          border: "none", borderRadius: 22, color: "white",
          background: "linear-gradient(135deg,#6E3DFF 0%,#FF3D7F 60%,#FF6B2C 100%)",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 24px rgba(110,61,255,0.22)",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>POznaj wrapped</div>
            <div className="pz-h" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginTop: 4 }}>
              Twój 2026 — dość dobry rok.
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 6 }}>
              {attendanceData.length} wydarzeń · {Object.values(stamps).filter(Boolean).length} dzielnic · {friendsList.length} osób
            </div>
          </div>
          <span style={{ marginLeft: "auto", opacity: 0.85 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          </span>
        </button>
      </div>

      {/* Friends row */}
      <div style={{ padding: "0 18px 6px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 className="pz-h" style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Znajomi</h2>
          <button onClick={() => setInviteOpen(true)} style={{ border: 0, background: "transparent", color: "var(--ink-3)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Zaproś +
          </button>
        </div>
      </div>
      <div style={{ padding: "0 18px 14px", display: "flex", gap: 14, overflowX: "auto" }}>
        {friendsList.map((f) => (
          <div key={f.id} style={{ textAlign: "center", flex: "0 0 56px" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 99, background: f.color,
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
              border: "2px solid var(--bg)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            }}>{f.name[0]}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: "var(--ink-2)" }}>{f.name}</div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div style={{ padding: "8px 18px 0" }}>
        <h2 className="pz-h" style={{ margin: "8px 0 12px", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Co u znajomych</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {friendsList.slice(0, 5).map((f, i) => (
            <div key={f.id} style={{
              display: "flex", gap: 12, padding: "12px 0",
              borderBottom: "0.5px solid var(--line)",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 99, background: f.color,
                color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>{f.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}>
                  <b style={{ color: "var(--ink)" }}>{f.name}</b> {["idzie na", "zapisała", "idzie na", "zapisał", "idzie na"][i]} <b style={{ color: "var(--ink)" }}>wydarzenie</b>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>{["2h temu", "5h temu", "8h temu", "wczoraj", "wczoraj"][i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: "18px 18px 0" }}>
        <button onClick={() => signOut()} style={{
          width: "100%", padding: "14px 18px", borderRadius: 18,
          border: "0.5px dashed var(--ink-5)", background: "transparent",
          color: "var(--ink-3)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Wyloguj się
        </button>
      </div>

      {showQuiz && <VibeQuiz onClose={() => setShowQuiz(false)} />}
      <YearInReview
        open={yirOpen}
        onClose={() => setYirOpen(false)}
        stats={{
          events: attendanceData.length,
          newPlaces: Object.values(stamps).filter(Boolean).length,
          friends: friendsList.length,
          topDistrict,
          topCategory,
        }}
      />
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      <Toast msg={toast} onClear={() => setToast(null)} />
    </div>
  );
}
