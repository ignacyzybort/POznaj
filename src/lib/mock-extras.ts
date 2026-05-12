import type { EventData } from "@/lib/data";

export const PZ_NEARBY_NOW: { name: string; color: string; where: string; mins: number }[] = [
  { name: "Aga", color: "#FF3D7F", where: "Stary Browar", mins: 4 },
  { name: "Kuba", color: "#6E3DFF", where: "CK Zamek", mins: 12 },
  { name: "Zosia", color: "#FFB627", where: "Tama", mins: 25 },
];

export const PZ_TRENDING_VENUES: { name: string; intensity: number; count: number }[] = [
  { name: "Stary Browar", intensity: 0.95, count: 1240 },
  { name: "CK Zamek", intensity: 0.88, count: 890 },
  { name: "Tama", intensity: 0.82, count: 540 },
  { name: "Concordia", intensity: 0.62, count: 210 },
  { name: "Cytadela", intensity: 0.55, count: 180 },
  { name: "MTP", intensity: 0.70, count: 320 },
];

export const CAT_GLYPH: Record<string, string> = {
  Muzyka: "♪", Kino: "✦", Sztuka: "◆", Sport: "↗", Teatr: "☾",
  Warsztaty: "✺", Konferencje: "◯", Jedzenie: "✿", Inne: "✶",
};

const TRANSIT_RING = [
  { line: "5", kind: "tram" as const, mins: 2, to: "Dębiec", last: "23:47" },
  { line: "6", kind: "tram" as const, mins: 6, to: "Junikowo", last: "23:52" },
  { line: "167", kind: "bus" as const, mins: 12, to: "Sobieskiego", last: "00:14" },
];

const WEATHER_RING = [
  { icon: "sun" as const, label: "21°", sub: "czysto", warn: false },
  { icon: "cloud" as const, label: "17°", sub: "pochmurno", warn: false },
  { icon: "rain" as const, label: "14°", sub: "deszcz", warn: true },
  { icon: "moon" as const, label: "12°", sub: "chłodno", warn: false },
];

function eventIndex(ev: EventData): number {
  const m = ev.id.match(/\d+/);
  if (m) return parseInt(m[0], 10) || 0;
  let h = 0;
  for (let i = 0; i < ev.id.length; i++) h = (h * 31 + ev.id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function deriveTransit(ev: EventData) {
  return TRANSIT_RING[eventIndex(ev) % TRANSIT_RING.length];
}

export function deriveWeather(ev: EventData) {
  const base = WEATHER_RING[eventIndex(ev) % WEATHER_RING.length];
  // only warn when outdoor + rainy
  return { ...base, warn: base.warn && ev.outdoor };
}

export function deriveCarpool(ev: EventData): number {
  return (eventIndex(ev) * 7) % 5;
}

export function deriveFriendsGoing(ev: EventData): { name: string; color: string }[] {
  const pool = [
    { name: "Aga", color: "#FF3D7F" },
    { name: "Marek", color: "#2860FF" },
    { name: "Wiktoria", color: "#C8FF2E" },
    { name: "Kuba", color: "#6E3DFF" },
    { name: "Zosia", color: "#FFB627" },
    { name: "Bartek", color: "#FF6B2C" },
    { name: "Hania", color: "#1F2D5A" },
  ];
  const i = eventIndex(ev);
  const n = (i % 3) + 1;
  const start = i % pool.length;
  const out: typeof pool = [];
  for (let k = 0; k < n; k++) out.push(pool[(start + k) % pool.length]);
  return out;
}
