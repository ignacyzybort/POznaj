"use client";

import { useEffect, useState } from "react";
import { districts, categories, vibes } from "@/lib/filters";
import { categoryVisual } from "@/lib/visuals";

interface Preferences {
  preferredCategories: string[];
  preferredDistricts: string[];
  preferredVibes: string[];
}

type PrefKey = keyof Preferences;

const sections: {
  key: PrefKey;
  title: string;
  emoji: string;
  options: { value: string; label: string; emoji?: string }[];
}[] = [
  {
    key: "preferredCategories",
    title: "Kategorie",
    emoji: "🏷️",
    options: categories.map((c) => ({
      value: c.value,
      label: c.label,
      emoji: categoryVisual[c.value]?.emoji,
    })),
  },
  {
    key: "preferredDistricts",
    title: "Dzielnice",
    emoji: "📍",
    options: districts.map((d) => ({ value: d.value, label: d.label })),
  },
  {
    key: "preferredVibes",
    title: "Nastroje",
    emoji: "💫",
    options: vibes.map((v) => ({ value: v.value, label: v.label })),
  },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>({
    preferredCategories: [],
    preferredDistricts: [],
    preferredVibes: [],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("poznaj-preferences");
    if (raw) {
      try {
        setPrefs(JSON.parse(raw));
      } catch {}
    }
  }, []);

  function toggle(key: PrefKey, value: string) {
    setPrefs((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
    setSaved(false);
  }

  function save() {
    localStorage.setItem("poznaj-preferences", JSON.stringify(prefs));
    setSaved(true);
  }

  const hasSelections = Object.values(prefs).some((arr) => arr.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="flex items-center gap-3 mb-10">
        <span className="text-3xl">⚙️</span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Preferencje
          </h1>
          <p className="text-sm text-zinc-400">
            Wybierz co lubisz, a dostosujemy wyniki
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.key} className="p-6 rounded-2xl bg-white border border-zinc-100">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              {section.emoji} {section.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {section.options.map((opt) => {
                const active = prefs[section.key].includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(section.key, opt.value)}
                    className={`text-sm px-4 py-2.5 rounded-full font-bold transition-all duration-200 ${
                      active
                        ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-105"
                        : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                    }`}
                  >
                    {opt.emoji && `${opt.emoji} `}{opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-zinc-100">
        <button
          onClick={save}
          className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-all duration-200 shadow-lg shadow-zinc-900/20"
        >
          💾 Zapisz preferencje
        </button>
        {saved && (
          <span className="text-sm font-bold text-emerald-600">✅ Zapisano!</span>
        )}
        {hasSelections && (
          <button
            onClick={() => {
              setPrefs({
                preferredCategories: [],
                preferredDistricts: [],
                preferredVibes: [],
              });
              localStorage.removeItem("poznaj-preferences");
              setSaved(true);
            }}
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Wyczyść wszystko
          </button>
        )}
      </div>
    </div>
  );
}
