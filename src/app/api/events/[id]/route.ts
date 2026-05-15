import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { vibes: { select: { vibe: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    }

    const serialized = {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      vibes: event.vibes.map((v) => v.vibe),
      coordsX: event.coordsX,
      coordsY: event.coordsY,
    };

    return NextResponse.json({ event: serialized });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
