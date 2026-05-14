"use client";

import { districts } from "@/lib/data";
import { PassportIcon, CheckIcon, LockIcon } from "@/components/icons";

export default function PassportCard({ stamps }: { stamps: Record<string, number> }) {
  return (
    <div style={{
      padding: 16, borderRadius: 22,
      background: "linear-gradient(135deg, var(--c-kino) 0%, var(--c-konferencje) 100%)",
      color: "white",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p className="pz-eyebrow" style={{ fontSize: 10, opacity: 0.6 }}>Paszport</p>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>Dzielnice Poznania</p>
        </div>
        <PassportIcon size={16} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {districts.map((d) => {
          const count = stamps[d.value] ?? 0;
          const unlocked = count > 0;
          return (
            <div key={d.value}
              style={{
                aspectRatio: "1", borderRadius: 12,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                background: unlocked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                boxShadow: unlocked ? "inset 0 0 0 1px rgba(255,255,255,0.3)" : "none",
              }}
            >
              {unlocked ? <CheckIcon size={14} /> : <LockIcon size={14} />}
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, opacity: 0.8, lineHeight: 1.1 }}>
                {d.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
