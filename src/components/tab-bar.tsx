"use client";

import { usePathname } from "next/navigation";
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
  const activeTab = pathMap[pathname] ?? "";

  if (pathname.startsWith("/event/") || pathname === "/login" || pathname === "/onboarding") return null;

  return (
    <div className="pz-tabbar">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <a key={t.id} href={t.id === "home" ? "/" : `/${t.id === "cal" ? "plan" : t.id === "saved" ? "lista" : t.id === "profile" ? "profil" : t.id}`}
             className="pz-tab" data-active={activeTab === t.id}>
            <Icon size={22} />
            <span>{t.label}</span>
          </a>
        );
      })}
    </div>
  );
}
