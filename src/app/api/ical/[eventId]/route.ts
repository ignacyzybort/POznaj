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
  // RFC 5545 limits content lines to 75 octets (not characters) — Polish
  // diacritics are 2 bytes in UTF-8, so measure bytes and back off to the
  // nearest UTF-8 boundary to never split a multi-byte character.
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const chunks: string[] = [];
  let current = "";
  let limit = 75;
  for (const char of line) {
    const next = current + char;
    if (encoder.encode(next).length > limit) {
      chunks.push(current);
      current = " " + char;
      limit = 75;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.join("\r\n");
}

// HTTP header values must be Latin-1 (ByteString); Polish diacritics are not,
// so an unsanitised title in Content-Disposition made the whole response throw
// (HTTP 500) for ~36% of events. Provide an ASCII fallback filename plus the
// RFC 5987 UTF-8 variant, which is itself percent-encoded (pure ASCII).
function icsFilename(title: string): { ascii: string; utf8: string } {
  const ascii = title
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "wydarzenie";

  let utf8 = "wydarzenie";
  try {
    utf8 = encodeURIComponent(Array.from(title).slice(0, 80).join(""));
  } catch {
    // Lone surrogate in a scraped title — fall back to the ASCII name.
  }
  return { ascii, utf8 };
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

    const filename = icsFilename(event.title);
    return new NextResponse(lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename.ascii}.ics"; filename*=UTF-8''${filename.utf8}.ics`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("[ical] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
