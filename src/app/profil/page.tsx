import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CHALLENGES, getResetDate } from "@/lib/challenges";
import ProfilClient, { type InitialProfile } from "./profil-client";

export default async function ProfilPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="pz-scroll" style={{ position: "absolute", inset: 0 }}>
        <div className="pz-page" style={{ padding: "calc(16px + var(--safe-t)) 18px 96px" }}>
          <div style={{ marginBottom: 20 }}>
            <span className="pz-sans-display" style={{ fontSize: 16, color: "var(--ink)" }}>
              poznaj<span style={{ color: "var(--sage)" }}>.</span>
            </span>
          </div>
          <div style={{ maxWidth: 480, margin: "clamp(24px, 8vh, 72px) auto 0", textAlign: "center" }}>
            <div className="pz-eyebrow" style={{ marginBottom: 14 }}>Twoje konto</div>
            <div className="pz-display" style={{ fontSize: "clamp(64px, 12vw, 104px)", lineHeight: 0.9, letterSpacing: "-0.05em", marginBottom: 20 }}>
              Ty<em>.</em>
            </div>
            <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--ink-3)", margin: "0 auto 24px", maxWidth: 340 }}>
              Zaloguj się, aby zapisywać wydarzenia, zbierać pieczątki dzielnic i widzieć, gdzie idą znajomi.
            </p>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 50, padding: "0 30px", borderRadius: 99, fontSize: "var(--text-base)", fontWeight: 600, background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}>Zaloguj się</Link>
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line-2)" }}>
              <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none" }}>Albo najpierw zobacz, co się dzieje →</Link>
            </div>
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
        _count: { select: { attendance: true, sentFriendships: true } },
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
            time: true,
            price: true,
            category: true,
            district: true,
            imageUrl: true,
            outdoor: true,
            vibes: { select: { vibe: true } },
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

  // Compute and persist challenge progress
  const friendIdsForChallenges = friendships.map((f) => (f.senderId === userId ? f.receiverId : f.senderId));
  const friendGoing = friendIdsForChallenges.length > 0
    ? await prisma.attendance.findMany({
        where: { userId: { in: friendIdsForChallenges }, status: "GOING" },
        select: { eventId: true },
      })
    : [];
  const challengeContext = { friendEventIds: Array.from(new Set(friendGoing.map((a) => a.eventId))) };

  const goingItemsRaw = attendance.map((a) => ({
    event: {
      id: a.event.id,
      startDate: a.event.startDate.toISOString(),
      time: a.event.time,
      price: a.event.price,
      category: a.event.category,
      district: a.event.district,
      placeName: a.event.placeName,
      outdoor: a.event.outdoor,
      vibes: a.event.vibes.map((v) => v.vibe),
    },
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));
  const challengeRows: { challengeKey: string; tier: string; progress: number; maxProgress: number; done: boolean; completedAt: Date | null; resetAt: Date }[] = [];
  for (const c of CHALLENGES) {
    const result = c.check(goingItemsRaw, { preferredCategories: [], preferredDistricts: [] }, challengeContext);
    const completedAt = result.done ? new Date() : null;
    const resetAt = getResetDate(c.tier);
    challengeRows.push({
      challengeKey: c.key, tier: c.tier, progress: result.progress,
      maxProgress: c.maxProgress, done: result.done, completedAt, resetAt,
    });
  }

  // Upsert UserChallenge rows
  if (challengeRows.length > 0) {
    for (const row of challengeRows) {
      await prisma.userChallenge.upsert({
        where: { userId_challengeKey_resetAt: { userId, challengeKey: row.challengeKey, resetAt: row.resetAt } },
        create: { ...row, userId },
        update: { progress: row.progress, done: row.done, completedAt: row.completedAt },
      });
    }
  }

  // Fetch current challenge state
  const userChallenges = await prisma.userChallenge.findMany({
    where: { userId, resetAt: { gte: new Date() } },
    orderBy: { tier: "asc" },
  });

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
      timeSlot: a.timeSlot,
      event: {
        id: a.event.id,
        title: a.event.title,
        placeName: a.event.placeName,
        startDate: a.event.startDate.toISOString(),
        category: a.event.category,
        district: a.event.district,
        imageUrl: a.event.imageUrl,
        outdoor: a.event.outdoor,
        vibes: a.event.vibes.map((v) => v.vibe),
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
    challenges: userChallenges.map((c) => ({
      challengeKey: c.challengeKey,
      tier: c.tier,
      progress: c.progress,
      maxProgress: c.maxProgress,
      done: c.done,
      completedAt: c.completedAt?.toISOString() ?? null,
      resetAt: c.resetAt.toISOString(),
    })),
  };

  return <ProfilClient initial={initial} />;
}
