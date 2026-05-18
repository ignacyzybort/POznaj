import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeEventScore } from "@/lib/scoring";
import { sendPushNotification } from "@/lib/push";

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
      recomputeEventScore(prisma, eventId);
      return NextResponse.json({ status: null });
    }

    const attendance = await prisma.attendance.create({
      data: { userId, eventId, status: finalStatus },
    });

    if (finalStatus === "GOING" || finalStatus === "SAVED") {
      await prisma.activity.create({
        data: { userId, eventId, type: finalStatus },
      });
    }

    recomputeEventScore(prisma, eventId);

    const friends = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      select: { senderId: true, receiverId: true },
    });
    const friendIds = friends.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    if (friendIds.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const userName = user?.name ?? "Znajomy";
      await prisma.notification.createMany({
        data: friendIds.map((fid) => ({
          userId: fid,
          eventId: eventId,
          type: "FRIEND_ATTENDING",
          title: `${userName} wybiera się na wydarzenie`,
          body: finalStatus === "GOING" ? "Dołącz do znajomego!" : null,
        })),
      });

      for (const fid of friendIds) {
        sendPushNotification(fid, {
          title: `${userName} wybiera się na wydarzenie`,
          body: finalStatus === "GOING" ? "Dołącz do znajomego!" : undefined,
          url: `/event/${eventId}`,
        });
      }
    }

    return NextResponse.json({ status: attendance.status });
  } catch (e) {
    console.error("[attendance] error:", e);
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
      take: 50,
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
  } catch (e) {
    console.error("[attendance] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
