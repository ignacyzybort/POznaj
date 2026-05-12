import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ activities: [] });
  }

  const userId = session.user?.id;
  if (!userId) return NextResponse.json({ activities: [] });

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: session.user.id, status: "ACCEPTED" },
        { receiverId: session.user.id, status: "ACCEPTED" },
      ],
    },
  });

  const friendIds = friendships.map((f) =>
    f.senderId === userId ? f.receiverId : f.senderId
  );

  const activities = await prisma.activity.findMany({
    where: { userId: { in: friendIds } },
    include: {
      user: { select: { id: true, name: true, image: true } },
      event: { select: { id: true, title: true, startDate: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serialized = activities.map((a) => ({
    ...a,
    event: {
      ...a.event,
      startDate: a.event.startDate.toISOString(),
    },
  }));

  return NextResponse.json({ activities: serialized });
}
