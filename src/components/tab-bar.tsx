"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { HomeIcon, MapIcon, CalIcon, SavedIcon, ProfileIcon } from "@/components/icons";

const tabs = [
  { id: "home", icon: HomeIcon, label: "Dziś" },
  { id: "map", icon: MapIcon, label: "Mapa" },
  { id: "cal", icon: CalIcon, label: "Plan" },
  { id: "saved", icon: SavedIcon, label: "Lista" },
  { id: "profile", icon: ProfileIcon, label: "Ja" },
];

const pathMap: Record<string, string> = {
  "/": "home",
  "/mapa": "map",
  "/plan": "cal",
  "/lista": "saved",
  "/profil": "profile",
};

export default function TabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const activeTab = pathMap[pathname] ?? "";
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/notifications?countOnly=true")
      .then((r) => r.json())
      .then((d) => setNotifCount(d.count ?? 0))
      .catch(() => {});
  }, [session]);

  if (pathname.startsWith("/event/") || pathname === "/login" || pathname === "/onboarding") return null;

  return (
    <div className="pz-tabbar">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <Link key={t.id} href={t.id === "home" ? "/" : `/${t.id === "map" ? "mapa" : t.id === "cal" ? "plan" : t.id === "saved" ? "lista" : t.id === "profile" ? "profil" : t.id}`}
             className="pz-tab" data-active={activeTab === t.id}
             style={{ position: "relative" }}>
            <Icon size={22} />
            <span>{t.label}</span>
            {t.id === "profile" && notifCount > 0 && (
              <span style={{
                position: "absolute", top: 2, right: "50%", marginRight: -28,
                minWidth: 18, height: 18, borderRadius: 99,
                background: "var(--hot)", color: "white",
                fontSize: 9.5, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "0 5px",
              }}>{notifCount > 9 ? "9+" : notifCount}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
