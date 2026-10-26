import { prisma } from "@/lib/prisma";

let webpush: any = null;
try {
  webpush = require("web-push");
  // The public key is exposed to the client as NEXT_PUBLIC_VAPID_PUBLIC_KEY
  // (that is the name in .env and the name the browser uses to subscribe), so
  // requiring only VAPID_PUBLIC_KEY here left setVapidDetails() uncalled and
  // every push request went out without a VAPID Authorization header.
  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (vapidSubject && vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } else {
    console.warn("[push] VAPID keys incomplete — push notifications disabled");
    webpush = null;
  }
} catch {
  console.warn("[push] web-push unavailable — push notifications disabled");
}

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
