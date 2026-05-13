"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { districts, categoryEmoji } from "@/lib/data";
import Link from "next/link";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

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
  const hue1 = ((user.name ?? "").length * 37) % 360;
  const hue2 = (hue1 + 40) % 360;
  const createdAt = new Date(user.createdAt).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)", paddingBottom: 96 }}>
      {/* Back button */}
      <div style={{ padding: "12px 16px 0" }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
      </div>

      {/* Cover */}
      <div style={{ height: 120, margin: "0 16px", borderRadius: 18, overflow: "hidden", background: `linear-gradient(135deg, hsl(${hue1},70%,55%), hsl(${hue2},80%,40%))` }}>
        {user.coverImage && <img src={user.coverImage} alt="" className="w-full h-full object-cover" />}
      </div>

      {/* Avatar + name */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, overflow: "hidden", border: "3px solid var(--bg)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", flexShrink: 0, background: `linear-gradient(135deg, hsl(${hue2},70%,55%), hsl(${hue1},80%,40%))` }}>
            {user.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 800 }}>
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div>
            <div className="pz-h" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>{user.name ?? "Użytkownik"}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
              {user.handle ? `@${user.handle}` : ""}{districtLabel ? ` · ${districtLabel}` : ""}
            </div>
          </div>
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
            <div className="pz-num" style={{ fontSize: 24, fontWeight: 700 }}>{user._count.sentFriendships}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2, fontWeight: 600 }}>znajomi</div>
          </div>
        </div>
      </div>

      {/* Join date */}
      <div style={{ padding: "14px 18px 0" }}>
        <p style={{ fontSize: 12, color: "var(--ink-4)" }}>W POznaj od {createdAt}</p>
      </div>

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
