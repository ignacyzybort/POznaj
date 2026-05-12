import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, status } = await request.json();

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
    data: { userId, eventId, status: status ?? "GOING" },
  });

  await prisma.activity.create({
    data: { userId, eventId, type: "GOING" },
  });

  return NextResponse.json({ status: attendance.status });
}

export async function GET(request: NextRequest) {
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
}
