import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventId: unknown = body?.eventId;
    const status: unknown = body?.status;

    if (typeof eventId !== "string" || !eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const validStatuses = ["GOING", "SAVED", "INTERESTED"] as const;
    const finalStatus = typeof status === "string" && validStatuses.includes(status as never)
      ? status as typeof validStatuses[number]
      : "GOING";

    const existing = await prisma.attendance.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.attendance.delete({
        where: { userId_eventId: { userId, eventId } },
      });
      return NextResponse.json({ status: null });
    }

    const attendance = await prisma.attendance.create({
      data: { userId, eventId, status: finalStatus },
    });

    await prisma.activity.create({
      data: { userId, eventId, type: "GOING" },
    });

    return NextResponse.json({ status: attendance.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ attendance: [] });
    }

    const attendance = await prisma.attendance.findMany({
      where: { userId },
      include: { event: { include: { vibes: { select: { vibe: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const serialized = attendance.map((a) => ({
      ...a,
      event: {
        ...a.event,
        startDate: a.event.startDate.toISOString(),
        endDate: a.event.endDate.toISOString(),
        vibes: a.event.vibes.map((v) => v.vibe),
      },
    }));

    return NextResponse.json({ attendance: serialized });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
