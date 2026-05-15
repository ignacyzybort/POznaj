import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Push notifications
self.addEventListener("push", (event: any) => {
  const data = event.data?.json() ?? {};
  self.registration.showNotification(data.title ?? "POznaj", {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url ?? "/" },
  });
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
