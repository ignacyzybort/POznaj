"use client";

import { startOfWeek, subWeeks, format } from "date-fns";
import { pl } from "date-fns/locale";

export default function StreakCard({
  weeks,
  currentStreak,
  longestStreak,
}: {
  weeks: number[];
  currentStreak: number;
  longestStreak: number;
}) {
  const maxVal = Math.max(...weeks, 1);
  const weekLabels = Array.from({ length: 8 }, (_, i) => {
    const d = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 7 - i);
    return format(d, "dd.MM", { locale: pl });
  });

  return (
    <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--sage), var(--sage-2))", color: "white" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Seria</p>
          <p className="text-sm font-bold">Twój tydzień</p>
        </div>
        <span className="text-2xl">🔥</span>
      </div>

      <div className="flex items-end gap-1.5 h-16 mb-3">
        {weeks.map((val, i) => {
          const h = Math.max(4, (val / maxVal) * 48);
          const active = i === weeks.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: h,
                  background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                  borderRadius: "2px 2px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between gap-3">
        <div className="text-center flex-1 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
          <p className="text-lg font-bold">{currentStreak}</p>
          <p className="text-[9px] font-semibold opacity-70">bieżąca</p>
        </div>
        <div className="text-center flex-1 p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.15)" }}>
          <p className="text-lg font-bold">{longestStreak}</p>
          <p className="text-[9px] font-semibold opacity-70">najlepsza</p>
        </div>
      </div>
    </div>
  );
}
