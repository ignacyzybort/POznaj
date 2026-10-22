"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const SKIP_PATHS = ["/onboarding", "/login", "/api"];

export default function OnboardingGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    if (localStorage.getItem("poznaj-onboarded") === "true") return;

    let cancelled = false;
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.user?.onboardedAt) {
          localStorage.setItem("poznaj-onboarded", "true");
          return;
        }
        router.replace("/onboarding");
      })
      .catch(() => {
        if (!cancelled) router.replace("/onboarding");
      });

    return () => { cancelled = true; };
  }, [status, pathname, router]);

  return null;
}
