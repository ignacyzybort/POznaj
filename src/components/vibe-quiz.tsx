"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const questions = [
  {
    id: "energy",
    question: "Jak masz energię?",
    options: [
      { value: "chill", label: "Chill, niski klucz 😌", emoji: "😌" },
      { value: "medium", label: "Średnio, ale mogę wyjść 😐", emoji: "🤷" },
      { value: "high", label: "W pełni gotowy! 🔋", emoji: "🔋" },
    ],
  },
  {
    id: "budget",
    question: "Ile chcesz wydać?",
    options: [
      { value: "free", label: "Za darmo 💰 → 0 zł", emoji: "🆓" },
      { value: "moderate", label: "Do 50 zł 💸", emoji: "💸" },
      { value: "any", label: "Bez limitu 💎", emoji: "💎" },
    ],
  },
  {
    id: "company",
    question: "Z kim idziesz?",
    options: [
      { value: "solo", label: "Sam/sama 🧘", emoji: "🧘" },
      { value: "date", label: "Na randkę 💕", emoji: "💕" },
      { value: "friends", label: "Ze znajomymi 🎉", emoji: "🎉" },
      { value: "family", label: "Rodzinnie 👨‍👩‍👧‍👦", emoji: "👨‍👩‍👧‍👦" },
    ],
  },
  {
    id: "distance",
    question: "Jak daleko?",
    options: [
      { value: "nearby", label: "Blisko domu 🏠", emoji: "🏠" },
      { value: "center", label: "Centrum 🏙️", emoji: "🏙️" },
      { value: "anywhere", label: "Wszystko jedno 🌍", emoji: "🌍" },
    ],
  },
];

export default function VibeQuiz({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const router = useRouter();

  const q = questions[step];
  const isLast = step === questions.length - 1;

  const answer = (value: string) => {
    setAnswers({ ...answers, [q.id]: value });
    if (isLast) {
      localStorage.setItem("poznaj-quiz", JSON.stringify({ ...answers, [q.id]: value }));
      onClose();
      router.refresh();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,19,15,0.5)" }}>
      <div className="rounded-3xl p-6 mx-4 max-w-sm w-full" style={{ background: "var(--bg-elev)" }}>
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? "var(--ink)" : "var(--line-2)" }}
            />
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>
          Pytanie {step + 1} z {questions.length}
        </p>
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--ink)" }}>
          {q.question}
        </h2>

        <div className="space-y-2 mb-4">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => answer(opt.value)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left border-0 cursor-pointer transition-all active:scale-[0.98]"
              style={{
                background: answers[q.id] === opt.value ? "var(--sage-soft)" : "var(--bg-soft)",
                border: answers[q.id] === opt.value ? "1px solid var(--sage)" : "0.5px solid var(--line)",
              }}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{opt.label}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold border-0 cursor-pointer" style={{ background: "var(--bg-soft)", color: "var(--ink-3)" }}>
          ✕ Zamknij
        </button>
      </div>
    </div>
  );
}
