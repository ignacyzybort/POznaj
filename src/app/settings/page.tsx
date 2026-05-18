"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { districts } from "@/lib/data";
import { useTheme } from "@/components/theme-provider";
import { DUR } from "@/lib/duration";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [notifyBefore, setNotifyBefore] = useState(() => {
    if (typeof window === "undefined") return 30;
    return parseInt(localStorage.getItem("poznaj-notify-minutes") ?? "30", 10);
  });
  const [savedDistrict, setSavedDistrict] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("poznaj-district") ?? "";
  });
  const [notificationsOn, setNotificationsOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("poznaj-notifications") === "true";
  });

  useEffect(() => {
    localStorage.setItem("poznaj-notify-minutes", String(notifyBefore));
  }, [notifyBefore]);

  useEffect(() => {
    if (savedDistrict) localStorage.setItem("poznaj-district", savedDistrict);
    else localStorage.removeItem("poznaj-district");
  }, [savedDistrict]);

  const toggleNotifications = async () => {
    if (!notificationsOn) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-csrf-token": document.cookie.split(";").map(c => c.trim()).find(r => r.startsWith("csrf-token="))?.split("=").slice(1).join("=") ?? "" },
            body: JSON.stringify({ subscription: sub }),
          });
          setNotificationsOn(true);
          localStorage.setItem("poznaj-notifications", "true");
        } catch {
          setNotificationsOn(false);
          localStorage.setItem("poznaj-notifications", "false");
        }
      } else {
        setNotificationsOn(false);
        localStorage.setItem("poznaj-notifications", "false");
      }
    } else {
      try {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "x-csrf-token": document.cookie.split(";").map(c => c.trim()).find(r => r.startsWith("csrf-token="))?.split("=").slice(1).join("=") ?? "" },
        });
      } catch {}
      setNotificationsOn(false);
      localStorage.setItem("poznaj-notifications", "false");
    }
  };

  const toggleRow = (label: string, sub: string, active: boolean, onToggle: () => void, accent?: string) => (
    <div className="pz-card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>
        </div>
        <button role="switch" aria-checked={active} onClick={onToggle} style={{
          position: "relative", width: 48, height: 28, borderRadius: 99, border: 0, cursor: "pointer",
          background: active ? (accent ?? "var(--sage)") : "var(--line-2)",
          transition: `background ${DUR.fast}ms var(--ease-out-quart)`,
        }}>
          <div style={{
            position: "absolute", top: 2, width: 24, height: 24, borderRadius: 99,
            background: "var(--bg-elev)", boxShadow: "var(--shadow-sm)",
            transition: `left ${DUR.fast}ms var(--ease-out-quart)`,
            left: active ? 22 : 2,
          }} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="pz-scroll" style={{ position: "absolute", inset: 0, background: "var(--bg)" }}>
      <div style={{ padding: "calc(16px + var(--safe-t)) 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.back()} aria-label="Wróć" style={{
          width: 44, height: 44, borderRadius: 99, border: 0,
          background: "var(--bg-soft)", color: "var(--ink)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <BackIcon size={20} />
        </button>
        <div>
          <div className="pz-eyebrow">Ustawienia</div>
          <div className="pz-h" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>Preferencje</div>
        </div>
      </div>

      <div style={{ padding: "6px 18px 96px" }}>
        {toggleRow("Wygląd", theme === "dark" ? "Tryb ciemny" : "Tryb jasny", theme === "dark", toggleTheme, "var(--c-kino)")}

        {toggleRow("Powiadomienia", `Przypomnij ${notifyBefore} min przed wydarzeniem`, notificationsOn, toggleNotifications)}

        {/* Domyślna dzielnica */}
        <div className="pz-card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>📍 Dzielnica</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {districts.map((d) => {
              const active = savedDistrict === d.value;
              return (
                <button key={d.value} className="pz-chip" data-active={active ? "true" : undefined}
                  onClick={() => setSavedDistrict(active ? "" : d.value)}>
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* O aplikacji */}
        <div className="pz-card" style={{ padding: 16 }}>
          <div className="pz-h" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>O POznaj</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
            POznaj pomaga odkrywać najlepsze wydarzenia w Poznaniu.
            Wersja 0.2 · Dane z PIK Poznań i poznan.pl.
          </div>
        </div>
      </div>
    </div>
  );
}
