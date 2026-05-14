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
        _count: { select: { attendance: true, savedEvents: true, sentFriendships: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
