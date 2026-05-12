"use client";

import { useEffect, useState, useCallback } from "react";
import { Event } from "@/generated/prisma";
import { districts, categories, vibes as vibeOptions, preferenceLabels } from "@/lib/filters";
import { categoryVisual } from "@/lib/visuals";
import EventCard from "@/components/event-card";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";

type FilterType = "district" | "category" | "vibe";

const filterOpts: Record<string, { value: string; label: string; emoji: string }[]> = {
  category: categories.map((c) => ({
    value: c.value,
    label: c.label,
    emoji: categoryVisual[c.value]?.emoji ?? "📌",
  })),
  district: districts.map((d) => ({
    value: d.value,
    label: d.label,
    emoji: "📍",
  })),
  vibe: vibeOptions.map((v) => ({
    value: v.value,
    label: v.label,
    emoji: "💫",
  })),
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (isSameDay(s, e)) return format(s, "d MMM", { locale: pl });
  return `${format(s, "d", { locale: pl })}–${format(e, "d MMM", { locale: pl })}`;
}

export default function HomePage() {
  const [events, setEvents] = useState<(Event & { vibes: string[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<
    Record<FilterType, string[]>
  >({ district: [], category: [], vibe: [] });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredCategories: [] as string[],
    preferredDistricts: [] as string[],
    preferredVibes: [] as string[],
  });

  useEffect(() => {
    const saved = localStorage.getItem("poznaj-preferences");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (search) params.set("search", search);

    for (const d of activeFilters.district) params.append("district", d);
    for (const c of activeFilters.category) params.append("category", c);
    for (const v of activeFilters.vibe) params.append("vibe", v);
    for (const c of preferences.preferredCategories) params.append("prefCategory", c);
    for (const d of preferences.preferredDistricts) params.append("prefDistrict", d);
    for (const v of preferences.preferredVibes) params.append("prefVibe", v);

    try {
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [search, activeFilters, preferences]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleFilter = (type: FilterType, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const hasAnyFilter = Object.values(activeFilters).some((arr) => arr.length > 0);
  const activeCount = Object.values(activeFilters).reduce((a, b) => a + b.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            Wydarzenia w Poznaniu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {loading ? "..." : `${events.length} wydarzeń`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            showFilters || hasAnyFilter
              ? "bg-amber-500 text-white shadow-lg shadow-amber-200/50"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          {showFilters ? "✕ Ukryj" : hasAnyFilter ? `🎯 ${activeCount} filtrów` : "☰ Filtry"}
        </button>
      </div>

      {showFilters && (
        <div className="mb-10 p-6 rounded-2xl bg-white border border-amber-100 shadow-sm shadow-amber-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Szukaj wydarzeń..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-zinc-200 bg-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {(["category", "district", "vibe"] as FilterType[]).map((type) => (
            <div key={type} className="mb-5 last:mb-0">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                {type === "category"
                  ? "🏷️ Kategoria"
                  : type === "district"
                    ? "📍 Dzielnica"
                    : "💫 Nastrój"}
              </p>
              <div className="flex flex-wrap gap-2">
                {filterOpts[type].map((opt) => {
                  const active = activeFilters[type].includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleFilter(type, opt.value)}
                      className={`text-sm px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                        active
                          ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20 scale-105"
                          : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                      }`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {hasAnyFilter && (
            <button
              onClick={() =>
                setActiveFilters({ district: [], category: [], vibe: [] })
              }
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors mt-4"
            >
              Wyczyść wszystkie filtry →
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-zinc-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-zinc-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-16 bg-zinc-100 rounded-full" />
                <div className="h-5 w-3/4 bg-zinc-100 rounded-lg" />
                <div className="h-4 w-1/2 bg-zinc-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24">
          <span className="text-5xl mb-4 block">🔍</span>
          <p className="text-lg font-bold text-zinc-900">Brak wydarzeń</p>
          <p className="text-sm text-zinc-400 mt-1">Spróbuj zmienić filtry</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
