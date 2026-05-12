"use client";

import { districts, categoryEmoji } from "@/lib/data";

export default function PassportCard({ stamps }: { stamps: Record<string, number> }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #1F2D5A, #2A1F5A)", color: "white" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Pasztport</p>
          <p className="text-sm font-bold">Dzielnice Poznania</p>
        </div>
        <span className="text-2xl">🛂</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {districts.map((d) => {
          const count = stamps[d.value] ?? 0;
          const unlocked = count > 0;
          return (
            <div
              key={d.value}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all"
              style={{
                background: unlocked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                border: unlocked ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-sm">{unlocked ? "✅" : "🔒"}</span>
              <span className="text-[7px] font-semibold leading-tight opacity-80">
                {d.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
