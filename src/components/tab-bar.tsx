"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/", label: "Dziś", icon: "🏠" },
  { href: "/mapa", label: "Mapa", icon: "🗺️" },
  { href: "/plan", label: "Plan", icon: "📅" },
  { href: "/lista", label: "Lista", icon: "🔖" },
  { href: "/profil", label: "Ja", icon: "👤" },
];

export default function TabBar() {
  const pathname = usePathname();

  const isDetail = pathname.startsWith("/event/");
  if (isDetail) return null;

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50">
      <div className="h-16 rounded-[28px] bg-white/90 backdrop-blur-xl border border-[var(--line-2)] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_30px_rgba(20,19,15,0.10)] flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-active={active}
              className="flex-1 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-tight transition-all duration-150 active:scale-[0.94]"
              style={{
                color: active ? "var(--ink)" : "var(--ink-3)",
              }}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
