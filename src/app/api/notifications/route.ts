import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ notifications: [], count: 0 });

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("countOnly") === "true";

  const notifications = await prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (countOnly) {
    return NextResponse.json({ count: notifications.length });
  }

  // Also fetch pending friend requests with sender info
  const pendingRequests = await prisma.friendship.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json({
    notifications: serialized,
    requests: pendingRequests.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.sender.name ?? "Nieznajomy",
      createdAt: r.createdAt.toISOString(),
    })),
    count: notifications.length + pendingRequests.length,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notificationId, action } = await request.json();
  if (!notificationId || !action) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (action === "accept" || action === "reject") {
    const friendship = await prisma.friendship.findUnique({
      where: { id: notificationId },
    });

    if (!friendship || friendship.receiverId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "accept") {
      await prisma.friendship.update({
        where: { id: notificationId },
        data: { status: "ACCEPTED" },
      });
    } else {
      await prisma.friendship.delete({
        where: { id: notificationId },
      });
    }

    // Mark matching notification as read
    await prisma.notification.updateMany({
      where: { userId, type: "FRIEND_REQUEST", read: false },
      data: { read: true },
    });

    return NextResponse.json({ status: action === "accept" ? "ACCEPTED" : "REJECTED" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
