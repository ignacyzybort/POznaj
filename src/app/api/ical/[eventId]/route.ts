import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeIcal(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function fmtDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const title = escapeIcal(event.title);
    const desc = escapeIcal(event.description ?? "");
    const location = escapeIcal([event.placeName, event.address].filter(Boolean).join(", "));
    const url = `https://po-znaj.pl/event/${event.id}`;
    const start = fmtDate(event.startDate);
    const end = fmtDate(event.endDate);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//POznaj//Events//PL",
      "BEGIN:VEVENT",
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}\\n\\n${url}`,
      `LOCATION:${location}`,
      `URL:${url}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-z0-9ąćęłńóśźż]/gi, "_").slice(0, 40)}.ics"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
