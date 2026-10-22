const TZ = "Europe/Warsaw";

export interface EventSlot {
  start: Date;
  end: Date;
  label: string;
  allDay: boolean;
}

export function warsawParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function warsawOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  }).formatToParts(date);

  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

export function warsawToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const base = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = new Date(base);
  for (let i = 0; i < 2; i++) {
    utc = new Date(base - warsawOffsetMinutes(utc) * 60000);
  }
  return utc;
}

const TIME_RE = /^(\d{1,2})[:.](\d{2})(?:\s*[-–—]\s*(\d{1,2})[:.](\d{2}))?$/;

export function getEventSlots(startDate: Date, time?: string | null): EventSlot[] {
  const { year, month, day } = warsawParts(startDate);

  if (!time) {
    const start = warsawToUtc(year, month, day, 0, 0);
    return [{ start, end: new Date(start.getTime() + 86400000), label: "", allDay: true }];
  }

  const slots: EventSlot[] = [];
  for (const raw of time.split(",")) {
    const token = raw.trim().replace(/\s+/g, " ");
    const match = token.match(TIME_RE);
    if (!match) continue;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) continue;

    const start = warsawToUtc(year, month, day, hour, minute);
    let end: Date;

    if (match[3] && match[4]) {
      const endHour = Number(match[3]);
      const endMinute = Number(match[4]);
      if (endHour > 23 || endMinute > 59) continue;
      end = warsawToUtc(year, month, day, endHour, endMinute);
      if (end <= start) end = new Date(end.getTime() + 86400000);
    } else {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }

    slots.push({ start, end, label: token, allDay: false });
  }

  if (slots.length === 0) {
    const start = warsawToUtc(year, month, day, 0, 0);
    return [{ start, end: new Date(start.getTime() + 86400000), label: time.trim(), allDay: true }];
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}

export function reminderInstant(slot: EventSlot): Date {
  if (!slot.allDay) return slot.start;
  return new Date(slot.start.getTime() + 9 * 60 * 60 * 1000);
}

export function icalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function icalDateValue(date: Date): string {
  const { year, month, day } = warsawParts(date);
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

export function formatWarsaw(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, ...opts }).format(date);
}
