import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ activities: [] });
    }

    const userId = session.user?.id;
    if (!userId) return NextResponse.json({ activities: [], nextCursor: null });

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? "20");
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 20, 1), 50);
    const beforeRaw = searchParams.get("before");
    const before = beforeRaw ? new Date(beforeRaw) : null;
    const beforeFilter = before && !isNaN(before.getTime()) ? { createdAt: { lt: before } } : {};

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: session.user.id, status: "ACCEPTED" },
          { receiverId: session.user.id, status: "ACCEPTED" },
        ],
      },
    });

    const friendIds = friendships.map((f: { senderId: string; receiverId: string }) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );

    const activities = await prisma.activity.findMany({
      where: { userId: { in: friendIds }, ...beforeFilter },
      include: {
        user: { select: { id: true, name: true, image: true } },
        event: { select: { id: true, title: true, startDate: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const serialized = activities.map((a: { id: string; userId: string; eventId: string; type: string; createdAt: Date; user: { id: string; name: string | null; image: string | null }; event: { id: string; title: string; startDate: Date; category: string } }) => ({
      ...a,
      event: {
        ...a.event,
        startDate: a.event.startDate.toISOString(),
      },
    }));

    const hasMore = serialized.length > limit;
    const page = hasMore ? serialized.slice(0, limit) : serialized;
    return NextResponse.json({
      activities: page,
      nextCursor: hasMore ? page[page.length - 1]?.createdAt ?? null : null,
    });
  } catch (e) {
    console.error("[activities] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
