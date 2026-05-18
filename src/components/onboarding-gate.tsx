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

    const onboarded = localStorage.getItem("poznaj-onboarded");
    if (!onboarded) {
      router.push("/onboarding");
    }
  }, [status, pathname, router]);

  return null;
}
