import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ friends: [], requests: [] });
  }

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ friends: [], requests: [] });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (search) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
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
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { friendId, action } = await request.json();

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
    return NextResponse.json({ status: "PENDING" });
  }

  if (action === "accept") {
    await prisma.friendship.updateMany({
      where: { senderId: friendId, receiverId: userId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ status: "ACCEPTED" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
