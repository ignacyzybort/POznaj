import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeEventScore } from "@/lib/scoring";
import { sendPushNotification } from "@/lib/push";
import { Prisma } from "@prisma/client";

const VALID_STATUSES = ["GOING", "SAVED", "INTERESTED"] as const;

function parseTimeSlot(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventId: unknown = body?.eventId;
    if (typeof eventId !== "string" || !eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const status: unknown = body?.status;
    const finalStatus = typeof status === "string" && VALID_STATUSES.includes(status as never)
      ? (status as (typeof VALID_STATUSES)[number])
      : "GOING";
    const timeSlot = parseTimeSlot(body?.timeSlot);

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existing = await prisma.attendance.findFirst({
      where: { userId, eventId, timeSlot, status: finalStatus },
    });

    if (existing) {
      await prisma.attendance.delete({ where: { id: existing.id } });
      await recomputeEventScore(prisma, eventId);
      return NextResponse.json({ status: null, timeSlot });
    }

    const attendance = await prisma.attendance.create({
      data: { userId, eventId, status: finalStatus, timeSlot },
    });

    if (finalStatus === "GOING" || finalStatus === "SAVED") {
      const recent = await prisma.activity.findFirst({
        where: {
          userId,
          eventId,
          type: finalStatus,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (!recent) {
        await prisma.activity.create({ data: { userId, eventId, type: finalStatus } });
      }
    }

    await recomputeEventScore(prisma, eventId);

    if (finalStatus === "GOING") {
      const friends = await prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: userId, status: "ACCEPTED" },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        select: { senderId: true, receiverId: true },
      });
      const friendIds = friends.map((f) => (f.senderId === userId ? f.receiverId : f.senderId));

      if (friendIds.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const userName = user?.name ?? "Znajomy";

        await prisma.notification.createMany({
          data: friendIds.map((fid) => ({
            userId: fid,
            eventId,
            type: "FRIEND_ATTENDING",
            title: `${userName} idzie na wydarzenie`,
            body: "Dołącz do znajomego!",
          })),
        });

        await Promise.all(
          friendIds.map((fid) =>
            sendPushNotification(fid, {
              title: `${userName} idzie na wydarzenie`,
              body: "Dołącz do znajomego!",
              url: `/event/${eventId}`,
            })
          )
        );
      }
    }

    return NextResponse.json({ status: attendance.status, timeSlot });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") return NextResponse.json({ status: null });
      if (e.code === "P2025") return NextResponse.json({ status: null });
    }
    console.error("[attendance] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let eventId = searchParams.get("eventId") ?? "";
    let timeSlot: string | null = searchParams.has("timeSlot") ? parseTimeSlot(searchParams.get("timeSlot")) : null;
    let status = searchParams.get("status");

    if (!eventId && request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      eventId = typeof body?.eventId === "string" ? body.eventId : "";
      if (typeof body?.timeSlot === "string") timeSlot = parseTimeSlot(body.timeSlot);
      if (typeof body?.status === "string") status = body.status;
    }

    if (!eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    await prisma.attendance.deleteMany({
      where: {
        userId,
        eventId,
        ...(timeSlot !== null ? { timeSlot } : {}),
        ...(status && VALID_STATUSES.includes(status as never)
          ? { status: status as (typeof VALID_STATUSES)[number] }
          : {}),
      },
    });

    await recomputeEventScore(prisma, eventId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[attendance] delete error:", e);
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

    const { searchParams } = new URL(request.url);
    const eventIdsParam = searchParams.get("eventIds");

    if (eventIdsParam !== null) {
      const eventIds = eventIdsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 200);

      if (eventIds.length === 0) {
        return NextResponse.json({ attendance: [] });
      }

      const rows = await prisma.attendance.findMany({
        where: { userId, eventId: { in: eventIds } },
        select: { eventId: true, status: true, timeSlot: true },
      });

      return NextResponse.json({ attendance: rows });
    }

    const attendance = await prisma.attendance.findMany({
      where: { userId },
      include: { event: { include: { vibes: { select: { vibe: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const serialized = attendance.map((a) => ({
      id: a.id,
      status: a.status,
      timeSlot: a.timeSlot,
      event: {
        ...a.event,
        startDate: a.event.startDate.toISOString(),
        endDate: a.event.endDate.toISOString(),
        vibes: a.event.vibes.map((v) => v.vibe),
      },
    }));

    return NextResponse.json({ attendance: serialized });
  } catch (e) {
    console.error("[attendance] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
