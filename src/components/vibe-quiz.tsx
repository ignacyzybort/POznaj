"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EventData } from "@/lib/data";

const questions = [
  {
    id: "energy",
    question: "Jak masz energię?",
    options: [
      { value: "chill", label: "Chill, niski klucz 😌" },
      { value: "medium", label: "Średnio, ale mogę wyjść 😐" },
      { value: "high", label: "W pełni gotowy! 🔋" },
    ],
  },
  {
    id: "budget",
    question: "Ile chcesz wydać?",
    options: [
      { value: "free", label: "Za darmo" },
      { value: "moderate", label: "Do 50 zł" },
      { value: "any", label: "Bez limitu" },
    ],
  },
  {
    id: "company",
    question: "Z kim idziesz?",
    options: [
      { value: "solo", label: "Sam/sama 🧘" },
      { value: "date", label: "Na randkę 💕" },
      { value: "friends", label: "Ze znajomymi 🎉" },
      { value: "family", label: "Rodzinnie 👨‍👩‍👧‍👦" },
    ],
  },
  {
    id: "distance",
    question: "Jak daleko?",
    options: [
      { value: "nearby", label: "Blisko domu 🏠" },
      { value: "center", label: "Centrum 🏙️" },
      { value: "anywhere", label: "Wszystko jedno 🌍" },
    ],
  },
];

const vibeMap: Record<string, string[]> = {
  chill: ["Spokojne"],
  high: ["Aktywne", "Impreza"],
  date: ["Randka"],
  friends: ["Impreza", "WyjscieZeZnajomymi"],
  family: ["Rodzinne"],
  solo: ["Spokojne", "Kulturalne"],
  free: ["Aktywne"],
};

export default function VibeQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<EventData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  const close = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  const q = questions[step];
  const isLast = step === questions.length - 1;

  useEffect(() => {
    if (showResults && recommendations.length > 0) {
      localStorage.setItem("poznaj-quiz", JSON.stringify(answers));
    }
  }, [showResults, recommendations, answers]);

  const answer = async (value: string) => {
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (isLast) {
      // Build vibe filters from answers
      const vibeParams: string[] = [];
      for (const [, val] of Object.entries(newAnswers)) {
        const mapped = vibeMap[val];
        if (mapped) vibeParams.push(...mapped);
      }

      try {
        const params = new URLSearchParams();
        if (vibeParams.length) params.append("vibe", vibeParams[0]);
        const res = await fetch(`/api/events?limit=3&${params.toString()}`);
        const data = await res.json();
        setRecommendations(data.events?.slice(0, 3) ?? []);
      } catch {
        setRecommendations([]);
      }
      setShowResults(true);
    } else {
      setStep(step + 1);
    }
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
        background: "rgba(20,19,15,0.5)",
        animation: exiting ? "pz-fade-out 0.2s ease both" : undefined,
      }}>
        <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)", maxHeight: "80%", overflow: "auto" }}>
          <div className="text-center mb-4">
            <span className="text-4xl">🎯</span>
            <h2 className="text-lg font-bold mt-2" style={{ color: "var(--ink)" }}>Dopasowaliśmy dla Ciebie</h2>
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>Najlepsze wydarzenia na dziś</p>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-6" style={{ color: "var(--ink-3)" }}>
              <p className="text-sm">Nie znaleźliśmy dopasowań</p>
              <p className="text-xs mt-1">Spróbuj zmienić odpowiedzi</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {recommendations.map((ev) => (
                <a key={ev.id} href={`/event/${ev.id}`}
                  className="flex gap-3 p-3 rounded-2xl no-underline"
                  style={{ background: "var(--bg-soft)", display: "flex" }}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-elev)]">
                    {ev.imageUrl && <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold line-clamp-2" style={{ color: "var(--ink)" }}>{ev.title}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                      📍 {ev.placeName} · {ev.time ?? ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}

          <button onClick={close} className="w-full py-3 rounded-2xl text-sm font-bold border-0 cursor-pointer"
            style={{ background: "var(--ink)", color: "var(--bg)" }}>
            Super!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
      background: "rgba(20,19,15,0.5)",
      animation: exiting ? "pz-fade-out 0.2s ease both" : undefined,
    }}>
      <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)" }}>
        <div className="flex gap-1.5 mb-6">
          {questions.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? "var(--ink)" : "var(--line-2)" }} />
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>
          Pytanie {step + 1} z {questions.length}
        </p>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--ink)" }}>{q.question}</h2>

        <div className="space-y-2 mb-4">
          {q.options.map((opt) => (
            <button key={opt.value} onClick={() => answer(opt.value)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left border-0 cursor-pointer transition-all active:scale-[0.98]"
              style={{
                background: answers[q.id] === opt.value ? "var(--sage-soft)" : "var(--bg-soft)",
                border: answers[q.id] === opt.value ? "1px solid var(--sage)" : "0.5px solid var(--line)",
              }}>
              <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{opt.label}</span>
            </button>
          ))}
        </div>

        <button onClick={close} className="w-full py-3 rounded-2xl text-sm font-semibold border-0 cursor-pointer"
          style={{ background: "var(--bg-soft)", color: "var(--ink-3)" }}>
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
}
