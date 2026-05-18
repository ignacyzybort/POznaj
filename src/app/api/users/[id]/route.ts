import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        coverImage: true,
        handle: true,
        bio: true,
        district: true,
        createdAt: true,
        _count: { select: { attendance: true, savedEvents: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const friendCount = await prisma.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: id }, { receiverId: id }],
      },
    });

    let friendshipStatus: string | null = null;
    if (session.user.id !== id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: id },
            { senderId: id, receiverId: session.user.id },
          ],
        },
        select: { senderId: true, status: true },
      });
      if (friendship) {
        friendshipStatus =
          friendship.status === "ACCEPTED"
            ? "ACCEPTED"
            : friendship.senderId === session.user.id
              ? "PENDING_SENT"
              : "PENDING_RECEIVED";
      }
    }

    let mutualFriendCount = 0;
    let mutualFriends: { id: string; name: string | null; image: string | null }[] = [];
    const currentUserId = session.user.id;
    if (currentUserId !== id) {
      const myFriendIds = (
        await prisma.friendship.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          },
          select: { senderId: true, receiverId: true },
        })
      ).map((f) => (f.senderId === currentUserId ? f.receiverId : f.senderId));

      const theirFriendIds = (
        await prisma.friendship.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ senderId: id }, { receiverId: id }],
          },
          select: { senderId: true, receiverId: true },
        })
      ).map((f) => (f.senderId === id ? f.receiverId : f.senderId));

      const intersection = myFriendIds.filter((fid) => theirFriendIds.includes(fid));
      mutualFriendCount = intersection.length;

      if (intersection.length > 0) {
        mutualFriends = await prisma.user.findMany({
          where: { id: { in: intersection.slice(0, 5) } },
          select: { id: true, name: true, image: true },
        });
      }
    }

    const activities = await prisma.activity.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        event: { select: { id: true, title: true, startDate: true, category: true } },
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        friendCount,
        friendshipStatus,
        mutualFriendCount,
        mutualFriends,
        createdAt: user.createdAt.toISOString(),
      },
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        createdAt: a.createdAt.toISOString(),
        event: {
          id: a.event.id,
          title: a.event.title,
          startDate: a.event.startDate.toISOString(),
          category: a.event.category,
        },
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
