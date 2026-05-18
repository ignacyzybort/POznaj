import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ friends: [] });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const friendIds = friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    if (friendIds.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: { in: friendIds },
        status: "GOING",
        event: { endDate: { gte: new Date() } },
      },
      select: {
        userId: true,
        user: { select: { name: true, image: true } },
        event: { select: { title: true, placeName: true, startDate: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const seen = new Set<string>();
    const friends: { name: string; image: string | null; placeName: string; eventTitle: string }[] = [];
    for (const a of attendances) {
      if (seen.has(a.userId)) continue;
      seen.add(a.userId);
      friends.push({
        name: a.user.name ?? "Znajomy",
        image: a.user.image,
        placeName: a.event.placeName,
        eventTitle: a.event.title,
      });
      if (friends.length >= 10) break;
    }

    return NextResponse.json({ friends });
  } catch (e) {
    console.error("[friends/going] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
