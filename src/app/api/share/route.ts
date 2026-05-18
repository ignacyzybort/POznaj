import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const friendId: unknown = body?.friendId;

    if (typeof eventId !== "string" || !eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }
    if (typeof friendId !== "string" || !friendId) {
      return NextResponse.json({ error: "Invalid friendId" }, { status: 400 });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      select: { id: true },
    });
    if (!friendship) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    const [event, sender] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const senderName = sender?.name ?? "Znajomy";

    await prisma.notification.create({
      data: {
        userId: friendId,
        type: "EVENT_SHARE",
        title: `${senderName} poleca: ${event.title}`,
        body: "Sprawdź to wydarzenie!",
      },
    });

    sendPushNotification(friendId, {
      title: `${senderName} poleca wydarzenie`,
      body: event.title,
      url: `/event/${eventId}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[share] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
