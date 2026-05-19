"use client";

import { useState, useEffect } from "react";

interface NearbyFriend {
  name: string;
  image?: string;
  color: string;
  where: string;
  eventTitle: string;
}

const COLORS = [
  "var(--c-teatr)", "var(--c-kino)", "var(--c-muzyka)", "var(--c-sztuka)", "var(--c-sport)", "var(--c-warsztaty)", "var(--c-jedzenie)"
];

export default function NearbyNow() {
  const [friends, setFriends] = useState<NearbyFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends/going")
      .then((r) => r.json())
      .then((d) => {
        if (d.friends && d.friends.length > 0) {
          setFriends(d.friends.slice(0, 5).map((f: any, i: number) => ({
            name: f.name ?? "Znajomy",
            image: f.image,
            color: COLORS[i % COLORS.length],
            where: f.placeName ?? "w Poznaniu",
            eventTitle: f.eventTitle ?? "",
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || friends.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 22px" }}>
      <div style={{
        display: "flex", alignItems: "baseline",
        justifyContent: "space-between", marginBottom: 10,
      }}>
        <h2 className="pz-h" style={{
          margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em",
        }}>Znajomi · idą</h2>
        <span className="pz-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 99,
            background: "var(--online-green)", boxShadow: "0 0 6px var(--online-green)",
            animation: "pz-pulse 1.6s infinite",
          }} />
          Live
        </span>
      </div>
      <div style={{
        display: "flex", gap: 10, overflowX: "auto",
        paddingBottom: 4, marginRight: -16,
      }}>
        {friends.map((n, i) => (
          <div key={i} className="pz-card" style={{
            flexShrink: 0, padding: 14, minWidth: 200,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 99,
              background: n.color, color: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, flexShrink: 0,
              position: "relative",
            }}>
              {n.name[0]}
              <span style={{
                position: "absolute", right: -1, bottom: -1,
                width: 12, height: 12, borderRadius: 99,
                background: "var(--online-green)", border: "2px solid var(--bg-elev)",
              }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{n.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>idzie na {n.eventTitle || n.where}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
