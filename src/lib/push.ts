import { prisma } from "@/lib/prisma";

let webpush: any = null;
try {
  webpush = require("web-push");
  if (process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch {}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body?: string; url?: string }
) {
  if (!webpush) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true },
    });
    if (!user?.pushSubscription) return;

    const sub = JSON.parse(user.pushSubscription);
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.statusCode === 410) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushSubscription: null },
      });
    }
  }
}
