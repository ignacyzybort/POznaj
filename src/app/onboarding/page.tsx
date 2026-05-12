"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, vibes as vibeOpts, districts, categoryEmoji, vibeEmoji } from "@/lib/data";

type Step = "welcome" | "categories" | "vibes" | "district" | "ready";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const steps: Step[] = ["welcome", "categories", "vibes", "district", "ready"];
  const currentIdx = steps.indexOf(step);

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const next = () => {
    if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1]);
  };

  const prev = () => {
    if (currentIdx > 0) setStep(steps[currentIdx - 1]);
  };

  const finish = () => {
    localStorage.setItem("poznaj-onboarded", "true");
    if (selectedCategories.length) localStorage.setItem("poznaj-preferredCategories", JSON.stringify(selectedCategories));
    if (selectedVibes.length) localStorage.setItem("poznaj-preferredVibes", JSON.stringify(selectedVibes));
    if (selectedDistrict) localStorage.setItem("poznaj-district", selectedDistrict);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Progress */}
      <div className="flex gap-1.5 justify-center pt-12 pb-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === currentIdx ? 24 : 8,
              background: i <= currentIdx ? "var(--ink)" : "var(--line-2)",
            }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-sm mx-auto w-full">
        {/* Welcome */}
        {step === "welcome" && (
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="text-6xl mb-6">👋</div>
            <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: "var(--ink)" }}>
              Co dziś<br />w Poznaniu.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-3)" }}>
              POznaj pomoże Ci znaleźć najlepsze wydarzenia w mieście.
              Dopasujemy je do Twoich zainteresowań.
            </p>
          </div>
        )}

        {/* Categories */}
        {step === "categories" && (
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--ink)" }}>
              Co Cię interesuje?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
              Wybierz kategorie, które lubisz
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = selectedCategories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    onClick={() => setSelectedCategories(toggle(selectedCategories, c.value))}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold border-0 cursor-pointer transition-all active:scale-95"
                    style={{
                      background: active ? "var(--ink)" : "var(--bg-soft)",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      border: active ? "none" : "0.5px solid var(--line)",
                    }}
                  >
                    {categoryEmoji[c.value]} {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vibes */}
        {step === "vibes" && (
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--ink)" }}>
              Jaki nastrój?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
              Jaki vibe najbardziej do Ciebie pasuje?
            </p>
            <div className="flex flex-wrap gap-2">
              {vibeOpts.map((v) => {
                const active = selectedVibes.includes(v.value);
                return (
                  <button
                    key={v.value}
                    onClick={() => setSelectedVibes(toggle(selectedVibes, v.value))}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold border-0 cursor-pointer transition-all active:scale-95"
                    style={{
                      background: active ? "var(--ink)" : "var(--bg-soft)",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      border: active ? "none" : "0.5px solid var(--line)",
                    }}
                  >
                    {vibeEmoji[v.value]} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* District */}
        {step === "district" && (
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--ink)" }}>
              Twoja dzielnica?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>
              Pokażemy Ci wydarzenia w okolicy
            </p>
            <div className="flex flex-wrap gap-2">
              {districts.map((d) => {
                const active = selectedDistrict === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDistrict(active ? "" : d.value)}
                    className="px-4 py-2.5 rounded-full text-sm font-semibold border-0 cursor-pointer transition-all active:scale-95"
                    style={{
                      background: active ? "var(--ink)" : "var(--bg-soft)",
                      color: active ? "var(--bg)" : "var(--ink-2)",
                      border: active ? "none" : "0.5px solid var(--line)",
                    }}
                  >
                    📍 {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ready */}
        {step === "ready" && (
          <div className="flex-1 flex flex-col justify-center text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: "var(--ink)" }}>
              Gotowe.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-3)" }}>
              Dziś masz to zrobione.
              {selectedCategories.length > 0 && ` ${selectedCategories.length} kategorie, `}
              {selectedVibes.length > 0 && `${selectedVibes.length} nastroje`}
              {selectedDistrict && ` — ${districts.find((d) => d.value === selectedDistrict)?.label}`}.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 pb-10 mt-auto">
          {currentIdx > 0 && (
            <button
              onClick={prev}
              className="h-12 px-6 rounded-2xl text-sm font-semibold border-0 cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--bg-soft)", color: "var(--ink-2)" }}
            >
              ← Wstecz
            </button>
          )}
          {currentIdx < steps.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 h-12 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              Dalej →
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 h-12 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--sage)", color: "white" }}
            >
              Rozpocznij! 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
