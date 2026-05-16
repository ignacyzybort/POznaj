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
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Progress */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "calc(16px + var(--safe-t)) 24px 16px" }}>
        {steps.map((s, i) => (
          <div key={s}
            style={{
              height: 6, borderRadius: 99,
              width: i === currentIdx ? 24 : 8,
              background: i <= currentIdx ? "var(--ink)" : "var(--line-2)",
              transition: "width var(--dur-base) var(--ease-out-quart), background var(--dur-base)",
            }}
          />
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px", maxWidth: 400, margin: "0 auto", width: "100%" }}>
        {/* Welcome */}
        {step === "welcome" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>👋</div>
            <h1 className="pz-h" style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 12px", lineHeight: 1.05, color: "var(--ink)" }}>
              Co dziś<br />w Poznaniu.
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-3)", margin: 0 }}>
              POznaj pomoże Ci znaleźć najlepsze wydarzenia w mieście.
              Dopasujemy je do Twoich zainteresowań.
            </p>
          </div>
        )}

        {/* Categories */}
        {step === "categories" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 className="pz-h" style={{ fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px", color: "var(--ink)" }}>
              Co Cię interesuje?
            </h2>
            <p style={{ fontSize: 13, marginBottom: 24, color: "var(--ink-3)" }}>
              Wybierz kategorie, które lubisz
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categories.map((c) => {
                const active = selectedCategories.includes(c.value);
                return (
                  <button key={c.value} className="pz-chip" aria-pressed={active} data-active={active ? "true" : undefined}
                    onClick={() => setSelectedCategories(toggle(selectedCategories, c.value))}>
                    {categoryEmoji[c.value]} {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vibes */}
        {step === "vibes" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 className="pz-h" style={{ fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px", color: "var(--ink)" }}>
              Jaki nastrój?
            </h2>
            <p style={{ fontSize: 13, marginBottom: 24, color: "var(--ink-3)" }}>
              Jaki vibe najbardziej do Ciebie pasuje?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {vibeOpts.map((v) => {
                const active = selectedVibes.includes(v.value);
                return (
                  <button key={v.value} className="pz-chip" aria-pressed={active} data-active={active ? "true" : undefined}
                    onClick={() => setSelectedVibes(toggle(selectedVibes, v.value))}>
                    {vibeEmoji[v.value]} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* District */}
        {step === "district" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 className="pz-h" style={{ fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px", color: "var(--ink)" }}>
              Twoja dzielnica?
            </h2>
            <p style={{ fontSize: 13, marginBottom: 24, color: "var(--ink-3)" }}>
              Pokażemy Ci wydarzenia w okolicy
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {districts.map((d) => {
                const active = selectedDistrict === d.value;
                return (
                  <button key={d.value} className="pz-chip" aria-pressed={active} data-active={active ? "true" : undefined}
                    onClick={() => setSelectedDistrict(active ? "" : d.value)}>
                    📍 {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ready */}
        {step === "ready" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>✅</div>
            <h1 className="pz-h" style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 12px", color: "var(--ink)" }}>
              Gotowe.
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-3)", margin: 0 }}>
              Dziś masz to zrobione.
              {selectedCategories.length > 0 && ` ${selectedCategories.length} kategorie, `}
              {selectedVibes.length > 0 && `${selectedVibes.length} nastroje`}
              {selectedDistrict && ` — ${districts.find((d) => d.value === selectedDistrict)?.label}`}.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 40, marginTop: "auto" }}>
          {currentIdx > 0 && (
            <button onClick={prev} className="pz-btn ghost" style={{ flex: 1, height: 48 }}>
              ← Wstecz
            </button>
          )}
          {currentIdx < steps.length - 1 ? (
            <button onClick={next} className="pz-btn primary" style={{ flex: 1, height: 48 }}>
              Dalej →
            </button>
          ) : (
            <button onClick={finish} style={{
              flex: 1, height: 48, borderRadius: 28, border: 0, cursor: "pointer",
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
              background: "var(--sage)", color: "white",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              Rozpocznij!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
