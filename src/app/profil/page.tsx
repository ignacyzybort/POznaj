import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfilClient, { type InitialProfile } from "./profil-client";

export default async function ProfilPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0 }}>
        <div style={{ padding: "calc(16px + var(--safe-t)) 18px 96px" }}>
          <div style={{ marginBottom: 20 }}>
            <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
              poznaj<span style={{ color: "var(--sage)" }}>.</span>
            </span>
          </div>
          <div style={{ padding: 32, borderRadius: 22, background: "var(--bg-soft)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: 16, color: "var(--ink-2)" }}>Zaloguj się</p>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, padding: "0 24px", borderRadius: 28, fontSize: "var(--text-base)", fontWeight: 600, background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}>Zaloguj się</Link>
          </div>
        </div>
      </div>
    );
  }

  const userId = session.user.id;

  const [user, attendance, friendships, pendingRequests, notifsRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        handle: true,
        bio: true,
        district: true,
        image: true,
        coverImage: true,
        _count: { select: { attendance: true, savedEvents: true, sentFriendships: true } },
      },
    }),
    prisma.attendance.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            placeName: true,
            startDate: true,
            category: true,
            district: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) {
    return null;
  }

  const friends = friendships.map((f) =>
    f.sender.id === userId ? f.receiver : f.sender,
  );
  const friendIds = friends.map((f) => f.id);

  const activitiesRaw = friendIds.length > 0
    ? await prisma.activity.findMany({
        where: { userId: { in: friendIds } },
        include: {
          user: { select: { id: true, name: true, image: true } },
          event: { select: { id: true, title: true, startDate: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  const initial: InitialProfile = {
    user: {
      id: user.id,
      name: user.name,
      handle: user.handle,
      bio: user.bio,
      district: user.district,
      image: user.image,
      coverImage: user.coverImage,
      _count: user._count,
      friendCount: friends.length,
    },
    attendance: attendance.map((a) => ({
      id: a.id,
      status: a.status,
      event: {
        id: a.event.id,
        title: a.event.title,
        placeName: a.event.placeName,
        startDate: a.event.startDate.toISOString(),
        category: a.event.category,
        district: a.event.district,
        imageUrl: a.event.imageUrl,
      },
    })),
    friends: friends.map((f) => ({ id: f.id, name: f.name })),
    activities: activitiesRaw.map((a) => ({
      id: a.id,
      type: a.type,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
      event: {
        id: a.event.id,
        title: a.event.title,
        startDate: a.event.startDate.toISOString(),
        category: a.event.category,
      },
    })),
    notifications: notifsRaw.map((n) => ({
      id: n.id,
      eventId: n.eventId,
      type: n.type,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
    requests: pendingRequests.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.sender.name ?? "Nieznajomy",
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return <ProfilClient initial={initial} />;
}
