"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchUser {
  id: string;
  name: string | null;
  image: string | null;
  district: string | null;
}

export default function InviteModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<string[]>([]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/friends?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch { setUsers([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const invite = async (friendId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, action: "send" }),
      });
      if (res.ok) setSentIds((prev) => [...prev, friendId]);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,19,15,0.5)" }}>
      <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)", maxHeight: "80%", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="pz-h" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Zaproś znajomych</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, border: 0, background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✕</button>
        </div>

        <input autoFocus type="text" placeholder="Szukaj po nazwie lub emailu..." value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: 14, border: "0.5px solid var(--line)", outline: "none", fontSize: 14, background: "var(--bg-soft)", color: "var(--ink)", marginBottom: 12 }} />

        <div className="pz-scroll" style={{ flex: 1, minHeight: 0 }}>
          {loading && <p style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", padding: 20 }}>Szukanie...</p>}
          {!loading && query.length < 2 && (
            <p style={{ color: "var(--ink-4)", fontSize: 13, textAlign: "center", padding: 20 }}>Wpisz co najmniej 2 znaki</p>
          )}
          {!loading && query.length >= 2 && users.length === 0 && (
            <p style={{ color: "var(--ink-4)", fontSize: 13, textAlign: "center", padding: 20 }}>Nie znaleziono użytkowników</p>
          )}
          {users.map((u) => {
            const sent = sentIds.includes(u.id);
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 99, background: "linear-gradient(135deg, #FF3D7F, #FFB627)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {u.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)" }}>{u.name ?? "Użytkownik"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{u.district ? `📍 ${u.district}` : ""}</div>
                </div>
                <button onClick={() => invite(u.id)} disabled={sent}
                  style={{ border: 0, padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: sent ? "default" : "pointer", background: sent ? "var(--bg-soft)" : "var(--ink)", color: sent ? "var(--ink-3)" : "var(--bg)" }}>
                  {sent ? "Wysłano" : "Zaproś"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
