"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { EventData } from "@/lib/data";
import Link from "next/link";

type ListTab = "saved" | "going";

export default function ListaPage() {
  const [tab, setTab] = useState<ListTab>("saved");
  const [items, setItems] = useState<any[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetch("/api/attendance").then((r) => r.json()).then((d) => {
        setItems(d.attendance ?? []);
      });
    }
  }, [session]);

  if (!session) {
    return (
      <div className="p-5 pt-10">
        <div className="pz-eyebrow">Twoja lista</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1 mb-6">Zapisane.</h1>
        <div className="rounded-2xl bg-[var(--bg-soft)] p-8 text-center">
          <div className="text-4xl mb-3">🔖</div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--ink-3)" }}>
            Zaloguj się, aby zapisywać wydarzenia
          </p>
          <Link href="/login" className="inline-flex items-center justify-center h-11 px-6 rounded-2xl text-sm font-bold no-underline" style={{ background: "var(--ink)", color: "var(--bg)" }}>
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  const filtered = tab === "saved"
    ? items.filter((a: any) => a.status === "SAVED")
    : items.filter((a: any) => a.status === "GOING");

  return (
    <div className="p-5 pt-10" style={{ paddingBottom: 120 }}>
      <div className="pz-eyebrow">Twoja lista</div>
      <h1 className="text-3xl font-bold tracking-tight mt-1 mb-6">
        {tab === "saved" ? "Zapisane." : "Idziesz."}
      </h1>

      <div className="inline-flex p-0.5 bg-[var(--bg-soft)] rounded-[14px] gap-0.5 mb-6">
        <button onClick={() => setTab("saved")} data-active={tab === "saved"}
          className="border-0 bg-transparent text-[var(--ink-3)] px-3.5 py-1.5 rounded-[11px] text-sm font-semibold tracking-tight transition-all duration-150 cursor-pointer data-[active=true]:bg-white data-[active=true]:text-[var(--ink)] data-[active=true]:shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          Zapisane ({items.filter((a: any) => a.status === "SAVED").length})
        </button>
        <button onClick={() => setTab("going")} data-active={tab === "going"}
          className="border-0 bg-transparent text-[var(--ink-3)] px-3.5 py-1.5 rounded-[11px] text-sm font-semibold tracking-tight transition-all duration-150 cursor-pointer data-[active=true]:bg-white data-[active=true]:text-[var(--ink)] data-[active=true]:shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          Idę ({items.filter((a: any) => a.status === "GOING").length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center" style={{ color: "var(--ink-4)" }}>
          <div className="text-3xl mb-2">{tab === "saved" ? "🏷️" : "🎯"}</div>
          <p className="text-sm font-medium">Jeszcze nic</p>
          <p className="text-xs mt-1">Zapisuj wydarzenia, aby tu trafiły</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <a key={a.id} href={`/event/${a.event.id}`} className="flex gap-3 p-3 rounded-2xl no-underline" style={{ background: "var(--bg-soft)" }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-elev)]">
                {a.event.imageUrl && (
                  <img src={a.event.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold line-clamp-1" style={{ color: "var(--ink)" }}>
                  {a.event.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
                  {a.event.placeName} · {new Date(a.event.startDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "var(--bg-elev)", color: "var(--ink-3)" }}>
                  {a.event.category}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
