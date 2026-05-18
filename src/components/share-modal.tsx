"use client";

import { useState, useEffect, useRef } from "react";
import { SearchIcon, CheckIcon } from "@/components/icons";
import { getCsrfToken } from "@/lib/csrf";

interface Friend {
  id: string;
  name: string | null;
  image: string | null;
}

export default function ShareModal({
  eventId,
  eventTitle,
  onClose,
}: {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        setFriends(d.friends ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleShare = async (friendId: string) => {
    if (sentTo.has(friendId)) return;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ eventId, friendId }),
      });
      if (res.ok) {
        setSentTo((prev) => new Set(prev).add(friendId));
      }
    } catch {}
  };

  const filtered = search
    ? friends.filter((f) => (f.name ?? "").toLowerCase().includes(search.toLowerCase()))
    : friends;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Wyślij wydarzenie znajomemu"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div style={{
        padding: "calc(16px + var(--safe-t)) 16px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={onClose} aria-label="Zamknij" style={{
          width: 36, height: 36, borderRadius: 99, border: 0,
          background: "var(--bg-soft)", color: "var(--ink)",
          cursor: "pointer", fontSize: 16, lineHeight: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>×</button>
        <div>
          <div className="pz-h" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
            Wyślij znajomemu
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 1, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {eventTitle}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", borderRadius: 14,
          background: "var(--bg-soft)",
        }}>
          <SearchIcon size={14} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj znajomych..."
            style={{
              border: 0, background: "transparent", outline: "none",
              fontSize: 14, color: "var(--ink)", flex: 1, minWidth: 0,
            }}
          />
        </div>
      </div>

      <div className="pz-scroll" style={{ flex: 1, padding: "0 16px 24px" }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
              <div className="pz-skeleton pz-skeleton-breath" style={{ width: 42, height: 42, borderRadius: 99 }} />
              <div className="pz-skeleton pz-skeleton-breath" style={{ width: 120, height: 14, borderRadius: 6 }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--ink-4)" }}>{search ? "Nie znaleziono" : "Brak znajomych"}</p>
          </div>
        ) : (
          filtered.map((f) => {
            const sent = sentTo.has(f.id);
            const name = f.name ?? "Znajomy";
            return (
              <div key={f.id} onClick={() => handleShare(f.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleShare(f.id); } }} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0", cursor: sent ? "default" : "pointer",
                borderBottom: "0.5px solid var(--line)",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 99, overflow: "hidden",
                  flexShrink: 0, background: "var(--bg-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--ink-3)", fontSize: 16, fontWeight: 700,
                }}>
                  {f.image ? (
                    <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    name[0].toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>{name}</div>
                </div>
                <div>
                  {sent ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: 99,
                      background: "var(--sage)", color: "white",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      animation: "pz-pop 0.3s var(--ease-spring)",
                    }}><CheckIcon size={16} /></div>
                  ) : (
                    <span style={{ fontSize: 12.5, color: "var(--ink-4)", fontWeight: 600 }}>
                      Wyślij →
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
