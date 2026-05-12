"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PassportCard from "@/components/passport-card";
import StreakCard from "@/components/streak-card";
import VibeQuiz from "@/components/vibe-quiz";
import { districts } from "@/lib/data";

export default function ProfilPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ attendance: 0, savedEvents: 0, sentFriendships: 0 });
  const [stamps, setStamps] = useState<Record<string, number>>({});
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/preferences").then((r) => r.json()).then((d) => {
      if (d.user?._count) setStats(d.user._count);
    });
    // compute passport stamps from attendance
    fetch("/api/attendance").then((r) => r.json()).then((d) => {
      const s: Record<string, number> = {};
      for (const a of d.attendance ?? []) {
        const dist = a.event?.district;
        if (dist) s[dist] = (s[dist] || 0) + 1;
      }
      for (const d of districts) {
        if (!s[d.value]) s[d.value] = 0;
      }
      setStamps(s);
    });
  }, [session]);

  if (!session?.user) {
    return (
      <div className="p-5 pt-10">
        <div className="pz-eyebrow">Profil</div>
        <h1 className="text-3xl font-bold tracking-tight mt-1 mb-6">Twoje konto.</h1>
        <div className="rounded-2xl bg-[var(--bg-soft)] p-8 text-center" style={{ border: "0.5px solid var(--line)" }}>
          <div className="text-5xl mb-4">👤</div>
          <p className="text-base font-semibold mb-4" style={{ color: "var(--ink-2)" }}>
            Zaloguj się, aby zapisywać wydarzenia i łączyć ze znajomymi
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl text-sm font-bold no-underline"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 pt-10" style={{ paddingBottom: 100 }}>
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, var(--sage), var(--sage-2))" }}
        >
          {session.user.name?.[0] ?? "?"}
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
            {session.user.name ?? "Użytkownik"}
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            {session.user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBox value={stats.attendance} label="plany" />
        <StatBox value={stats.savedEvents} label="zapisane" />
        <StatBox value={stats.sentFriendships} label="znajomi" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <StreakCard weeks={[1, 0, 2, 3, 1, 4, 2, 1]} currentStreak={1} longestStreak={4} />
        <PassportCard stamps={stamps} />
      </div>

      <button
        onClick={() => setShowQuiz(true)}
        className="w-full flex items-center justify-between p-4 rounded-2xl text-sm font-bold border-0 cursor-pointer mb-3"
        style={{ background: "linear-gradient(135deg, #1a4a1a, #2a6a2a)", color: "white" }}
      >
        <span>🎯 Dopasuj nastrój</span>
        <span>→</span>
      </button>

      <div className="space-y-3">
        <Link href="/settings" className="flex items-center gap-3 p-4 rounded-2xl no-underline" style={{ background: "var(--bg-soft)", color: "var(--ink-2)" }}>
          <span className="text-lg">⚙️</span>
          <span className="text-sm font-semibold">Ustawienia i preferencje</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold border-0 cursor-pointer"
          style={{ background: "var(--bg-soft)", color: "var(--ink-3)" }}
        >
          <span className="text-lg">🚪</span>
          Wyloguj się
        </button>
      </div>

      {showQuiz && <VibeQuiz onClose={() => setShowQuiz(false)} />}
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="p-4 rounded-2xl text-center" style={{ background: "var(--bg-soft)" }}>
      <div className="text-2xl font-bold" style={{ color: "var(--ink)" }}>{value}</div>
      <div className="text-[11px] font-semibold mt-0.5" style={{ color: "var(--ink-3)" }}>{label}</div>
    </div>
  );
}
