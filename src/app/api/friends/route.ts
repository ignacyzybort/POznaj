import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ friends: [], requests: [] });
    }

    const userId = session.user?.id;
    if (!userId) return NextResponse.json({ friends: [], requests: [] });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    if (search !== null) {
      const trimmed = search.trim();
      if (trimmed.length < 2 || trimmed.length > 64) {
        return NextResponse.json({ users: [] });
      }
      const users = await prisma.user.findMany({
        where: {
          id: { not: userId },
          name: { contains: trimmed, mode: "insensitive" },
        },
        select: { id: true, name: true, image: true, district: true, handle: true },
        take: 10,
      });
      return NextResponse.json({ users });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    const friends = friendships.map((f) =>
      f.sender.id === userId ? f.receiver : f.sender
    );

    const requests = await prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ friends, requests: requests.map((r) => r.sender) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const friendId: unknown = body?.friendId;
    const action: unknown = body?.action;

    if (typeof friendId !== "string" || !friendId) {
      return NextResponse.json({ error: "Invalid friendId" }, { status: 400 });
    }
    if (friendId === userId) {
      return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: friendId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "send") {
      const existing = await prisma.friendship.findUnique({
        where: { senderId_receiverId: { senderId: userId, receiverId: friendId } },
      });
      if (existing) return NextResponse.json({ error: "Already exists" });

      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await prisma.friendship.create({
        data: { senderId: userId, receiverId: friendId },
      });
      await prisma.notification.create({
        data: {
          userId: friendId,
          type: "FRIEND_REQUEST",
          title: `${sender?.name ?? "Ktoś"} chce być Twoim znajomym`,
          body: "Odpowiedz na zaproszenie w profilu",
        },
      });
      sendPushNotification(friendId, {
        title: `${sender?.name ?? "Ktoś"} chce być Twoim znajomym`,
        body: "Odpowiedz na zaproszenie w profilu",
        url: "/profil",
      });
      return NextResponse.json({ status: "PENDING" });
    }

    if (action === "accept") {
      await prisma.friendship.updateMany({
        where: { senderId: friendId, receiverId: userId, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });
      return NextResponse.json({ status: "ACCEPTED" });
    }

    if (action === "unfriend") {
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
      });
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
