"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { HomeIcon, MapIcon, CalIcon, SavedIcon, ProfileIcon } from "@/components/icons";

const TABS = [
  { id: "home", href: "/", icon: HomeIcon, label: "Dziś" },
  { id: "map", href: "/mapa", icon: MapIcon, label: "Mapa" },
  { id: "cal", href: "/plan", icon: CalIcon, label: "Plan" },
  { id: "saved", href: "/lista", icon: SavedIcon, label: "Lista" },
  { id: "profile", href: "/profil", icon: ProfileIcon, label: "Ja" },
] as const;

const PATH_MAP: Record<string, string> = {
  "/": "home",
  "/mapa": "map",
  "/plan": "cal",
  "/lista": "saved",
  "/profil": "profile",
};

const TAB_COUNT = TABS.length;
const INITIAL_TAB_PCT = 100 / TAB_COUNT;

export default function TabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTab = PATH_MAP[pathname] ?? "";
  const activeIdx = TABS.findIndex((t) => t.id === activeTab);
  const [notifCount, setNotifCount] = useState(0);
  const [measured, setMeasured] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  const measurePill = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = nav.querySelector<HTMLElement>('[data-active="true"]');
    if (!el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillStyle({
      left: elRect.left - navRect.left,
      width: elRect.width,
    });
    setMeasured(true);
  }, []);

  useEffect(() => {
    measurePill();
  }, [activeTab, measurePill]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(() => measurePill());
    observer.observe(nav);
    return () => observer.disconnect();
  }, [measurePill]);

  useEffect(() => {
    if (!session?.user) return;
    const ctrl = new AbortController();
    fetch("/api/notifications?countOnly=true", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setNotifCount(d.count ?? 0))
      .catch(() => {});
    return () => ctrl.abort();
  }, [session]);

  if (pathname.startsWith("/event/") || pathname === "/login" || pathname === "/onboarding") return null;

  const ssrLeft = activeIdx >= 0 ? activeIdx * INITIAL_TAB_PCT : 0;

  return (
    <nav ref={navRef} className="pz-tabbar" aria-label="Główna nawigacja">
      <span
        className={`pz-tab-pill${measured ? " measured" : ""}`}
        aria-hidden="true"
        style={{
          left: measured ? `${pillStyle.left}px` : `${ssrLeft}%`,
          width: measured ? `${pillStyle.width}px` : `${INITIAL_TAB_PCT}%`,
        }}
      />
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <Link
            key={t.id}
            href={t.href}
            className="pz-tab"
            data-active={isActive || undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={22} />
            <span>{t.label}</span>
            {t.id === "profile" && notifCount > 0 && (
              <span
                aria-label={`${notifCount} powiadomień`}
                style={{
                  position: "absolute",
                  top: 2,
                  right: "50%",
                  marginRight: -28,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 99,
                  background: "var(--hot)",
                  color: "white",
                  fontSize: 9.5,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                }}
              >
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
