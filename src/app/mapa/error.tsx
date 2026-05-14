"use client";

export default function MapaError({ reset }: { error: Error; reset: () => void }) {
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
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", textAlign: "center", marginBottom: 20 }}>
        Nie udało się załadować mapy.
      </p>
      <button
        onClick={reset}
        className="pz-btn"
        style={{ padding: "0 28px", height: 44, fontSize: "var(--text-sm)", cursor: "pointer" }}
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
