"use client";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 18px 96px",
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, marginBottom: 8 }}>Oops</div>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", textAlign: "center", marginBottom: 24, maxWidth: 280 }}>
        Coś poszło nie tak podczas ładowania strony.
      </p>
      <button
        onClick={reset}
        className="pz-btn"
        style={{ padding: "0 32px", height: 50, fontSize: "var(--text-base)", cursor: "pointer" }}
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
