import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventSlots, icalDate, icalDateValue, warsawParts } from "@/lib/warsaw-time";

function escapeIcal(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 72) {
    chunks.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rawMinutes = Number(new URL(request.url).searchParams.get("minutes") ?? "30");
    const minutes = Number.isFinite(rawMinutes) ? Math.min(Math.max(Math.round(rawMinutes), 5), 1440) : 30;

    const title = escapeIcal(event.title);
    const desc = escapeIcal(
      [event.description, "", `Szczegóły: https://po-znaj.pl/event/${event.id}`].filter(Boolean).join("\n")
    );
    const location = escapeIcal([event.placeName, event.address].filter(Boolean).join(", "));
    const url = `https://po-znaj.pl/event/${event.id}`;
    const stamp = icalDate(new Date());
    const slots = getEventSlots(event.startDate, event.time);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//POznaj//Events//PL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    const first = slots[0];
    if (first.allDay) {
      const endBase = event.endDate > event.startDate ? event.endDate : event.startDate;
      const endParts = warsawParts(new Date(endBase.getTime() + 86400000));
      lines.push(
        "BEGIN:VEVENT",
        `UID:${event.id}@po-znaj.pl`,
        `DTSTAMP:${stamp}`,
        `LAST-MODIFIED:${stamp}`,
        `DTSTART;VALUE=DATE:${icalDateValue(event.startDate)}`,
        `DTEND;VALUE=DATE:${endParts.year}${String(endParts.month).padStart(2, "0")}${String(endParts.day).padStart(2, "0")}`,
        foldLine(`SUMMARY:${title}`),
        foldLine(`DESCRIPTION:${desc}`),
        foldLine(`LOCATION:${location}`),
        `URL:${url}`,
        "BEGIN:VALARM",
        `TRIGGER:-PT${minutes}M`,
        "ACTION:DISPLAY",
        foldLine(`DESCRIPTION:${title}`),
        "END:VALARM",
        "END:VEVENT"
      );
    } else {
      slots.forEach((slot, index) => {
        lines.push(
          "BEGIN:VEVENT",
          `UID:${event.id}-${index}@po-znaj.pl`,
          `DTSTAMP:${stamp}`,
          `LAST-MODIFIED:${stamp}`,
          `DTSTART:${icalDate(slot.start)}`,
          `DTEND:${icalDate(slot.end)}`,
          foldLine(`SUMMARY:${title}${slots.length > 1 ? ` (${slot.label})` : ""}`),
          foldLine(`DESCRIPTION:${desc}`),
          foldLine(`LOCATION:${location}`),
          `URL:${url}`,
          "BEGIN:VALARM",
          `TRIGGER:-PT${minutes}M`,
          "ACTION:DISPLAY",
          foldLine(`DESCRIPTION:${title}`),
          "END:VALARM",
          "END:VEVENT"
        );
      });
    }

    lines.push("END:VCALENDAR");

    return new NextResponse(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-z0-9ąćęłńóśźż]/gi, "_").slice(0, 40)}.ics"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("[ical] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
