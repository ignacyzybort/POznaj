import { createHmac, timingSafeEqual } from "crypto";
import { PrismaClient } from "@prisma/client";
import { cancelScheduledEmail, isEmailConfigured, sendEmail } from "./email";
import { formatWarsaw, getEventSlots, reminderInstant } from "./warsaw-time";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://po-znaj.pl";
const HORIZON_MS = 29 * 24 * 60 * 60 * 1000;

export function eventStartInstant(event: { startDate: Date; time: string | null }): Date {
  return reminderInstant(getEventSlots(event.startDate, event.time)[0]);
}

function sign(userId: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`reminder-unsubscribe:${userId}`)
    .digest("base64url");
}

export function unsubscribeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(userId);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

function reminderEmail(event: {
  id: string;
  title: string;
  placeName: string;
  address: string | null;
  time: string | null;
  startDate: Date;
}, userId: string) {
  const slots = getEventSlots(event.startDate, event.time);
  const slot = slots[0];
  const when = slot.allDay
    ? formatWarsaw(slot.start, { weekday: "long", day: "numeric", month: "long" })
    : formatWarsaw(slot.start, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

  const url = `${APP_URL}/event/${event.id}`;
  const unsubscribe = `${APP_URL}/api/reminders/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`;
  const place = [event.placeName, event.address].filter(Boolean).join(", ");

  const subject = `Przypomnienie: ${event.title}`;
  const text = [
    `Za chwilę: ${event.title}`,
    when,
    place,
    "",
    `Szczegóły: ${url}`,
    "",
    `Nie chcesz przypomnień? ${unsubscribe}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="pl">
  <body style="margin:0;padding:0;background:#FDFCF8;color:#14130F;font-family:Inter,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFCF8;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #E7E3D8">
          <tr><td style="padding:28px 28px 8px">
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6B675C">POznaj · przypomnienie</div>
            <h1 style="margin:10px 0 0;font-family:Georgia,serif;font-size:28px;line-height:1.15;color:#14130F">${event.title}</h1>
          </td></tr>
          <tr><td style="padding:16px 28px 0">
            <p style="margin:0;font-size:16px;line-height:1.5"><strong>${when}</strong></p>
            <p style="margin:6px 0 0;font-size:15px;line-height:1.5;color:#3D3A33">${place}</p>
          </td></tr>
          <tr><td style="padding:24px 28px 28px">
            <a href="${url}" style="display:inline-block;background:#3D5A40;color:#ffffff;text-decoration:none;padding:12px 20px;font-size:15px;font-weight:600">Zobacz wydarzenie</a>
          </td></tr>
          <tr><td style="padding:0 28px 24px">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#6B675C">Dostajesz tę wiadomość, bo włączyłeś przypomnienie. <a href="${unsubscribe}" style="color:#6B675C">Wyłącz przypomnienia</a>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function scheduleReminder(prisma: PrismaClient, reminderId: string): Promise<string> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: {
      event: { select: { id: true, title: true, placeName: true, address: true, time: true, startDate: true } },
      user: { select: { id: true, email: true, emailReminders: true } },
    },
  });

  if (!reminder) return "MISSING";
  if (!reminder.user.email || !reminder.user.emailReminders) {
    await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "CANCELLED" } });
    return "CANCELLED";
  }

  const now = Date.now();
  if (reminder.eventStartAt.getTime() <= now) {
    await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "EXPIRED" } });
    return "EXPIRED";
  }

  if (reminder.resendEmailId) {
    await cancelScheduledEmail(reminder.resendEmailId);
  }

  if (!isEmailConfigured()) {
    await prisma.reminder.update({ where: { id: reminder.id }, data: { resendEmailId: null } });
    return "PENDING";
  }

  if (reminder.remindAt.getTime() > now + HORIZON_MS) {
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: "PENDING", resendEmailId: null },
    });
    return "PENDING";
  }

  const content = reminderEmail(reminder.event, reminder.user.id);
  const scheduledAt = reminder.remindAt.getTime() > now ? reminder.remindAt : undefined;
  const sent = await sendEmail({
    to: reminder.user.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    scheduledAt,
  });

  if (!sent) {
    await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "FAILED", resendEmailId: null } });
    return "FAILED";
  }

  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { status: "SCHEDULED", resendEmailId: sent.id, eventStartAt: reminder.eventStartAt },
  });
  return "SCHEDULED";
}

export async function cancelReminder(prisma: PrismaClient, reminderId: string): Promise<void> {
  const reminder = await prisma.reminder.findUnique({ where: { id: reminderId } });
  if (!reminder) return;
  if (reminder.resendEmailId) {
    await cancelScheduledEmail(reminder.resendEmailId);
  }
  await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "CANCELLED" } });
}

export async function syncReminders(
  prisma: PrismaClient,
  userId?: string
): Promise<{ checked: number; scheduled: number; cancelled: number }> {
  const now = Date.now();

  const reminders = await prisma.reminder.findMany({
    where: {
      ...(userId ? { userId } : {}),
      status: { in: ["PENDING", "SCHEDULED"] },
    },
    include: {
      event: { select: { startDate: true, time: true } },
      user: { select: { reminderMinutes: true, emailReminders: true } },
    },
    take: 500,
  });

  let scheduled = 0;
  let cancelled = 0;

  for (const reminder of reminders) {
    const start = eventStartInstant(reminder.event);
    const leadMinutes = Math.min(Math.max(reminder.user.reminderMinutes, 5), 1440);
    const desiredRemindAt = new Date(start.getTime() - leadMinutes * 60000);

    if (!reminder.user.emailReminders) {
      if (reminder.status === "SCHEDULED") await cancelReminder(prisma, reminder.id);
      else await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "CANCELLED" } });
      cancelled++;
      continue;
    }

    if (start.getTime() <= now) {
      const next = reminder.remindAt.getTime() <= now ? "SENT" : "CANCELLED";
      await prisma.reminder.update({ where: { id: reminder.id }, data: { status: next } });
      cancelled++;
      continue;
    }

    const changed =
      start.getTime() !== reminder.eventStartAt.getTime() ||
      desiredRemindAt.getTime() !== reminder.remindAt.getTime();

    if (changed || reminder.status === "PENDING") {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { eventStartAt: start, remindAt: desiredRemindAt, status: "PENDING" },
      });
      await scheduleReminder(prisma, reminder.id);
      scheduled++;
    }
  }

  return { checked: reminders.length, scheduled, cancelled };
}
