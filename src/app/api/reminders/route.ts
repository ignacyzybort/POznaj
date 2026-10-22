import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelReminder, eventStartInstant, scheduleReminder } from "@/lib/reminders";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ reminder: null });

    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });

    const reminder = await prisma.reminder.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId } },
      select: { remindAt: true, status: true },
    });

    const active = reminder && !["CANCELLED", "EXPIRED", "FAILED"].includes(reminder.status);
    return NextResponse.json({
      reminder: active ? { remindAt: reminder.remindAt.toISOString(), status: reminder.status } : null,
    });
  } catch (e) {
    console.error("[reminders] get error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const eventId = body?.eventId;
    if (typeof eventId !== "string" || !eventId) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const [event, user] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, startDate: true, time: true, endDate: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailReminders: true, reminderMinutes: true },
      }),
    ]);

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!user?.email) return NextResponse.json({ error: "No email address" }, { status: 400 });
    if (!user.emailReminders) {
      return NextResponse.json({ error: "Email reminders are disabled" }, { status: 400 });
    }

    const start = eventStartInstant(event);
    if (start.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Event already started" }, { status: 400 });
    }

    const minutes = Math.min(Math.max(user.reminderMinutes, 5), 1440);
    const remindAt = new Date(start.getTime() - minutes * 60000);

    const reminder = await prisma.reminder.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: {
        userId,
        eventId,
        remindAt,
        eventStartAt: start,
        status: "PENDING",
      },
      update: {
        remindAt,
        eventStartAt: start,
        status: "PENDING",
        resendEmailId: null,
      },
    });

    const status = await scheduleReminder(prisma, reminder.id);
    return NextResponse.json({ status, remindAt: remindAt.toISOString() });
  } catch (e) {
    console.error("[reminders] post error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });

    const reminder = await prisma.reminder.findUnique({
      where: { userId_eventId: { userId, eventId } },
      select: { id: true },
    });

    if (reminder) {
      await cancelReminder(prisma, reminder.id);
      await prisma.reminder.delete({ where: { id: reminder.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reminders] delete error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
