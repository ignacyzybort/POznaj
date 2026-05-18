"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { districts, categoryEmoji } from "@/lib/data";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BackIcon } from "@/components/icons";
import { getCsrfToken } from "@/lib/csrf";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setData(d);
          setFriendStatus(d.user.friendshipStatus);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleFriendAction = async (action: "send" | "accept" | "unfriend") => {
    if (!session?.user) { router.push("/login"); return; }
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify({ friendId: params.id, action }),
    });
    const d = await res.json();
    if (action === "unfriend") {
      setFriendStatus(null);
    } else if (action === "send") {
      setFriendStatus("PENDING_SENT");
    } else if (action === "accept") {
      setFriendStatus("ACCEPTED");
    }
  };

  if (loading) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-32 bg-zinc-100 rounded-2xl" />
          <div className="h-8 w-1/3 bg-zinc-100 rounded-lg" />
          <div className="h-4 w-1/2 bg-zinc-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
        <div style={{ padding: "54px 18px", textAlign: "center" }}>
          <div className="pz-display" style={{ fontSize: 38, marginBottom: 12 }}>😕</div>
          <p style={{ fontWeight: 700, color: "var(--ink)" }}>Nie znaleziono użytkownika</p>
          <button onClick={() => router.back()} style={{ marginTop: 12, border: 0, background: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>Wróć</button>
        </div>
      </div>
    );
  }

  const { user, activities } = data;
  const districtLabel = districts.find((d) => d.value === user.district)?.label ?? "";
  const COVER_GRADIENTS = [
    "linear-gradient(135deg, var(--c-muzyka), #FFB627)",
    "linear-gradient(135deg, var(--c-kino), var(--c-muzyka))",
    "linear-gradient(135deg, var(--c-sztuka), #06B6D4)",
    "linear-gradient(135deg, #C8FF2E, var(--sage))",
    "linear-gradient(135deg, var(--c-teatr), var(--c-sztuka))",
  ];
  const coverGradient = COVER_GRADIENTS[((user.name ?? "").length * 7) % COVER_GRADIENTS.length];
  const createdAt = new Date(user.createdAt).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)", paddingBottom: 96 }}>
      {/* Back button */}
      <div style={{ padding: "calc(16px + var(--safe-t)) 16px 0" }}>
        <button onClick={() => router.back()} aria-label="Wróć" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <BackIcon size={18} />
        </button>
      </div>

      {/* Cover */}
      <div style={{ height: 120, margin: "0 16px", borderRadius: 18, overflow: "hidden", background: coverGradient }}>
        {user.coverImage && <img src={user.coverImage} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Avatar + name */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, overflow: "hidden", border: "3px solid var(--bg)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", flexShrink: 0, background: coverGradient }}>
            {user.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 800 }}>
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="pz-h" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>{user.name ?? "Użytkownik"}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {user.handle ? `@${user.handle}` : ""}{districtLabel ? ` · ${districtLabel}` : ""}
            </div>
          </div>
          {session?.user?.id !== user.id && (
            <div>
              {friendStatus === null && (
                <button onClick={() => handleFriendAction("send")} className="pz-btn primary" style={{ height: 38, fontSize: 13, borderRadius: 22, padding: "0 16px" }}>
                  Dodaj znajomego
                </button>
              )}
              {friendStatus === "PENDING_SENT" && (
                <button onClick={() => handleFriendAction("unfriend")} className="pz-btn ghost" style={{ height: 38, fontSize: 13, borderRadius: 22, padding: "0 16px" }}>
                  Zaproszenie wysłane
                </button>
              )}
              {friendStatus === "PENDING_RECEIVED" && (
                <button onClick={() => handleFriendAction("accept")} className="pz-btn primary" style={{ height: 38, fontSize: 13, borderRadius: 22, padding: "0 16px" }}>
                  Zaakceptuj
                </button>
              )}
              {friendStatus === "ACCEPTED" && (
                <button onClick={() => handleFriendAction("unfriend")} className="pz-btn ghost" style={{ height: 38, fontSize: 13, borderRadius: 22, padding: "0 16px" }}>
                  Znajomi ✓
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div style={{ padding: "14px 18px 0" }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>{user.bio}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 18, background: "var(--bg-soft)", textAlign: "center" }}>
            <div className="pz-num" style={{ fontSize: 24, fontWeight: 700 }}>{user._count.attendance}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>wydarzeń</div>
          </div>
          <div style={{ padding: 14, borderRadius: 18, background: "var(--bg-soft)", textAlign: "center" }}>
            <div className="pz-num" style={{ fontSize: 24, fontWeight: 700 }}>{user._count.savedEvents}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>zapisane</div>
          </div>
          <div style={{ padding: 14, borderRadius: 18, background: "var(--bg-soft)", textAlign: "center" }}>
            <div className="pz-num" style={{ fontSize: 24, fontWeight: 700 }}>{user.friendCount}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>znajomi</div>
          </div>
        </div>
      </div>

      {/* Join date */}
      <div style={{ padding: "14px 18px 0" }}>
        <p style={{ fontSize: 12, color: "var(--ink-4)" }}>W POznaj od {createdAt}</p>
      </div>

      {/* Mutual friends */}
      {user.mutualFriendCount > 0 && user.mutualFriends && (
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {user.mutualFriends.slice(0, 5).map((f: any, i: number) => (
                <div key={f.id} style={{
                  width: 26, height: 26, borderRadius: 99, overflow: "hidden",
                  border: "2px solid var(--bg)", marginLeft: i > 0 ? -8 : 0,
                  flexShrink: 0, background: "var(--bg-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--ink-3)", fontSize: 12, fontWeight: 700,
                }}>
                  {f.image ? (
                    <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    f.name?.[0]?.toUpperCase() ?? "?"
                  )}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.3 }}>
              {user.mutualFriendCount === 1
                ? `Ty i ${user.name} macie 1 wspólnego znajomego`
                : `Ty i ${user.name} macie ${user.mutualFriendCount} wspólnych znajomych`}
            </span>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <div style={{ padding: "18px 18px 0" }}>
          <h2 className="pz-h" style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>🎯 Ostatnia aktywność</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activities.map((a: any) => {
              const daysAgo = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 86400000);
              const timeStr = daysAgo === 0 ? "dziś" : daysAgo === 1 ? "wczoraj" : `${daysAgo} dni temu`;
              return (
                <Link key={a.id} href={`/event/${a.event.id}`} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "0.5px solid var(--line)", textDecoration: "none" }}>
                  <span style={{ fontSize: 20 }}>{a.type === "GOING" ? "✅" : "🔖"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                      {a.type === "GOING" ? "Idzie na: " : "Zapisał: "}
                      <b style={{ color: "var(--ink)" }}>{a.event.title}</b>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 }}>
                      {categoryEmoji[a.event.category] ?? "📌"} {a.event.category} · {timeStr}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <div style={{ padding: "40px 18px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--ink-4)" }}>Brak aktywności</p>
        </div>
      )}
    </div>
  );
}
