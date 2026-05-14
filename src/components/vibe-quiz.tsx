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

  const overlay = (content: React.ReactNode) => (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--ink-3)",
      animation: exiting ? "pz-fade-out var(--dur-fast) var(--ease-out-quart) both" : undefined,
    }}>
      {content}
    </div>
  );

  if (showResults) {
    return overlay(
      <div style={{ margin: "0 16px", maxWidth: 384, width: "100%", padding: 24, borderRadius: 28, background: "var(--bg-elev)", maxHeight: "80%", overflow: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>🎯</span>
          <h2 className="pz-h" style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8, color: "var(--ink)" }}>Dopasowaliśmy dla Ciebie</h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)" }}>Najlepsze wydarzenia na dziś</p>
        </div>

        {recommendations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>
            <p style={{ fontSize: "var(--text-sm)" }}>Nie znaleźliśmy dopasowań</p>
            <p style={{ fontSize: "var(--text-xs)", marginTop: 4 }}>Spróbuj zmienić odpowiedzi</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {recommendations.map((ev) => (
              <a key={ev.id} href={`/event/${ev.id}`}
                style={{ display: "flex", gap: 12, padding: 12, borderRadius: 22, background: "var(--bg-soft)", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--bg-elev)" }}>
                  {ev.imageUrl && <img loading="lazy" src={ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink)", margin: 0, lineClamp: 2, WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.title}</p>
                  <p style={{ fontSize: "var(--text-xs)", marginTop: 4, color: "var(--ink-3)" }}>
                    📍 {ev.placeName} · {ev.time ?? ""}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        <button onClick={close} className="pz-btn primary full" style={{ height: 44, fontSize: "var(--text-sm)" }}>
          Super!
        </button>
      </div>
    );
  }

  return overlay(
    <div style={{ margin: "0 16px", maxWidth: 384, width: "100%", padding: 24, borderRadius: 28, background: "var(--bg-elev)" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= step ? "var(--ink)" : "var(--line-2)", transition: "background var(--dur-base) var(--ease-out-quart)" }} />
        ))}
      </div>

      <p className="pz-eyebrow" style={{ marginBottom: 4 }}>
        Pytanie {step + 1} z {questions.length}
      </p>
      <h2 className="pz-h" style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px" }}>{q.question}</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {q.options.map((opt) => (
          <button key={opt.value} onClick={() => answer(opt.value)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 22,
              textAlign: "left", border: answers[q.id] === opt.value ? "1px solid var(--sage)" : "0.5px solid var(--line)",
              cursor: "pointer", background: answers[q.id] === opt.value ? "var(--sage-soft)" : "var(--bg-soft)",
              color: "var(--ink)", fontSize: "var(--text-sm)", fontWeight: 600, transition: "all var(--dur-fast) var(--ease-out-quart)",
            }}>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <button onClick={close} className="pz-btn ghost full" style={{ height: 44, fontSize: "var(--text-sm)" }}>
        ✕ Zamknij
      </button>
    </div>
  );
}
