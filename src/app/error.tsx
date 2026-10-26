"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", textAlign: "center" }}>
      <div className="pz-display" style={{ fontSize: 56, marginBottom: 16 }}>?</div>
      <h1 className="pz-h" style={{ margin: "0 0 8px", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)" }}>
        Coś poszło nie tak
      </h1>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-3)", margin: "0 0 20px", maxWidth: 300 }}>
        Spróbuj odświeżyć stronę
      </p>
      <button onClick={reset} className="pz-btn primary" style={{ height: 44, fontSize: 13, padding: "0 24px" }}>
        Spróbuj ponownie
      </button>
    </div>
  );
}
